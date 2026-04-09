import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type Row = {
  date: string;
  category: string;
  description: string;
  itemNumber: string;
  manufacturer: string;
  vendorOrSource: string;
  qty: number | string;
  unitCost: number | string;
  total: number;
  reference: string;
};

function csvRow(row: Row): string {
  const fields = [
    row.date,
    row.category,
    row.description,
    row.itemNumber,
    row.manufacturer,
    row.vendorOrSource,
    row.qty,
    row.unitCost,
    row.total.toFixed(2),
    row.reference,
  ];
  return fields
    .map((f) => {
      const s = String(f ?? "");
      return s.includes(",") || s.includes('"') || s.includes("\n")
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    })
    .join(",");
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    select: { name: true },
  });
  if (!project)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const rows: Row[] = [];

  // ── 1 & 2. ProjectCost: MATERIAL + FREIGHT ────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = prisma as any;

  const costs = await db.projectCost.findMany({
    where: { projectId: id, costType: { in: ["MATERIAL", "FREIGHT"] } },
    include: {
      item: {
        select: { itemNumber: true, manufacturer: true, description: true },
      },
      shipment: {
        select: {
          tracking: true,
          carrier: true,
          createdAt: true,
          purchaseOrder: {
            select: {
              poNumber: true,
              vendor: { select: { name: true } },
            },
          },
        },
      },
      bomLine: {
        select: { bom: { select: { name: true } } },
      },
    },
    orderBy: { createdAt: "asc" },
  }) as {
    id: string;
    costType: string;
    amount: number;
    notes: string | null;
    poLink: string | null;
    createdAt: Date;
    item: {
      itemNumber: string;
      manufacturer: string | null;
      description: string | null;
    } | null;
    shipment: {
      tracking: string | null;
      carrier: string | null;
      createdAt: Date;
      purchaseOrder: {
        poNumber: string | null;
        vendor: { name: string } | null;
      } | null;
    } | null;
    bomLine: { bom: { name: string } } | null;
  }[];

  for (const c of costs) {
    const amount = Number(c.amount);
    const vendor =
      c.shipment?.purchaseOrder?.vendor?.name ??
      c.shipment?.carrier ??
      "";
    const reference =
      c.shipment?.purchaseOrder?.poNumber ??
      c.poLink ??
      c.shipment?.tracking ??
      "";
    const date = (c.shipment?.createdAt ?? c.createdAt)
      .toISOString()
      .slice(0, 10);

    if (c.costType === "MATERIAL") {
      rows.push({
        date,
        category: "Material",
        description:
          c.item?.description ?? c.bomLine?.bom.name ?? c.notes ?? "",
        itemNumber: c.item?.itemNumber ?? "",
        manufacturer: c.item?.manufacturer ?? "",
        vendorOrSource: vendor,
        qty: "",
        unitCost: "",
        total: amount,
        reference,
      });
    } else {
      // FREIGHT
      rows.push({
        date,
        category: "Freight",
        description: c.notes ?? c.shipment?.carrier ?? "Shipping",
        itemNumber: "",
        manufacturer: "",
        vendorOrSource: vendor || (c.shipment?.carrier ?? ""),
        qty: 1,
        unitCost: amount,
        total: amount,
        reference: c.shipment?.tracking ?? reference,
      });
    }
  }

  // ── 3. Return credits ─────────────────────────────────────────────────────
  try {
    const returns = await db.purchaseOrderReturn.findMany({
      where: { status: "CREDITED", po: { projectId: id } },
      include: {
        po: { include: { vendor: { select: { name: true } } } },
        lines: {
          include: {
            poLine: {
              include: {
                item: {
                  select: {
                    itemNumber: true,
                    manufacturer: true,
                    description: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { updatedAt: "asc" },
    });

    for (const ret of returns as {
      returnNumber: string | null;
      updatedAt: Date;
      po: { vendor: { name: string } | null };
      lines: {
        quantity: number;
        creditPerUnit: number | null;
        poLine: {
          item: {
            itemNumber: string;
            manufacturer: string | null;
            description: string | null;
          } | null;
        };
      }[];
    }[]) {
      for (const line of ret.lines) {
        const credit = (line.creditPerUnit ?? 0) * line.quantity;
        rows.push({
          date: ret.updatedAt.toISOString().slice(0, 10),
          category: "Return Credit",
          description: line.poLine.item?.description ?? "",
          itemNumber: line.poLine.item?.itemNumber ?? "",
          manufacturer: line.poLine.item?.manufacturer ?? "",
          vendorOrSource: ret.po.vendor?.name ?? "",
          qty: -line.quantity,
          unitCost: line.creditPerUnit ?? 0,
          total: -credit,
          reference: ret.returnNumber ?? "",
        });
      }
    }
  } catch {
    // returns table not yet migrated — skip
  }

  // ── 4. Labor (time entries) ───────────────────────────────────────────────
  const scopes = await prisma.projectScope.findMany({
    where: { projectId: id },
    include: {
      timeEntries: {
        include: { user: { select: { email: true, profile: true } } },
        orderBy: { date: "asc" },
      },
    },
  });

  for (const scope of scopes) {
    if (!scope.costPerHour) continue;
    for (const entry of scope.timeEntries) {
      const name =
        (
          entry.user.profile as
            | { firstName?: string; lastName?: string }
            | null
        )?.firstName ?? entry.user.email;
      rows.push({
        date: entry.date.toISOString().slice(0, 10),
        category: "Labor",
        description: scope.name,
        itemNumber: "",
        manufacturer: "",
        vendorOrSource: name,
        qty: entry.hours,
        unitCost: scope.costPerHour,
        total: entry.hours * scope.costPerHour,
        reference: scope.name,
      });
    }
  }

  // ── 5. Invoices ───────────────────────────────────────────────────────────
  const invoices = await prisma.invoice.findMany({
    where: { projectId: id, status: { not: "VOID" } },
    orderBy: { createdAt: "asc" },
  });

  for (const inv of invoices) {
    const amt = Number(inv.amount ?? 0);
    rows.push({
      date: inv.createdAt.toISOString().slice(0, 10),
      category: "Invoice",
      description: inv.invoiceNumber ?? inv.id,
      itemNumber: "",
      manufacturer: "",
      vendorOrSource: "Client",
      qty: 1,
      unitCost: amt,
      total: amt,
      reference: inv.invoiceNumber ?? inv.id,
    });
  }

  // ── Sort by date, then category ───────────────────────────────────────────
  const categoryOrder = [
    "Material",
    "Freight",
    "Return Credit",
    "Labor",
    "Invoice",
  ];
  rows.sort((a, b) => {
    const dateDiff = a.date.localeCompare(b.date);
    if (dateDiff !== 0) return dateDiff;
    return categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category);
  });

  // ── Build CSV ─────────────────────────────────────────────────────────────
  const header =
    "Date,Category,Description,Item #,Manufacturer,Vendor / Source,Qty,Unit Cost,Total,Reference";
  const csv = [header, ...rows.map(csvRow)].join("\n");

  const filename = `${project.name.replace(/[^a-z0-9]/gi, "_")}_financial_report.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
