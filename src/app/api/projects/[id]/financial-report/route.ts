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
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    select: { name: true },
  });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const rows: Row[] = [];

  // ── 1. PO lines ──────────────────────────────────────────────────────────────
  const pos = await prisma.purchaseOrder.findMany({
    where: { projectId: id, status: { not: "CANCELLED" } },
    include: {
      vendor: { select: { name: true } },
      lines: {
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
    orderBy: { createdAt: "asc" },
  });

  for (const po of pos) {
    for (const line of po.lines) {
      rows.push({
        date: po.createdAt.toISOString().slice(0, 10),
        category: "PO Material",
        description: line.item?.description ?? "",
        itemNumber: line.item?.itemNumber ?? "",
        manufacturer: line.item?.manufacturer ?? "",
        vendorOrSource: po.vendor?.name ?? "",
        qty: line.quantity,
        unitCost: line.cost,
        total: line.quantity * line.cost,
        reference: po.poNumber ?? po.id,
      });
    }
  }

  // ── 2. PO return credits ──────────────────────────────────────────────────────
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prismaAny = prisma as any;
    const returns = await prismaAny.purchaseOrderReturn.findMany({
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
      disposition?: string | null;
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

  // ── 3. Inventory allocations (BOM stock pulls) ────────────────────────────────
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prismaAny = prisma as any;
    const allocations = await prismaAny.inventoryMovement.findMany({
      where: { type: "BOM_ALLOCATION", bomLine: { bom: { projectId: id } } },
      include: {
        item: {
          select: {
            itemNumber: true,
            manufacturer: true,
            description: true,
            cost: true,
          },
        },
        bomLine: { include: { bom: { select: { name: true } } } },
      },
      orderBy: { createdAt: "asc" },
    });

    for (const m of allocations as {
      createdAt: Date;
      quantityDelta: number;
      item: {
        itemNumber: string;
        manufacturer: string | null;
        description: string | null;
        cost: number | null;
      } | null;
      bomLine: { bom: { name: string } } | null;
    }[]) {
      const qty = Math.abs(m.quantityDelta);
      const unitCost = m.item?.cost ?? 0;
      rows.push({
        date: m.createdAt.toISOString().slice(0, 10),
        category: "Inventory Allocation",
        description: m.item?.description ?? "",
        itemNumber: m.item?.itemNumber ?? "",
        manufacturer: m.item?.manufacturer ?? "",
        vendorOrSource: "Inventory",
        qty,
        unitCost,
        total: qty * unitCost,
        reference: m.bomLine?.bom.name ?? "",
      });
    }
  } catch {
    // pre-migration
  }

  // ── 4. Labor (time entries) ───────────────────────────────────────────────────
  const scopes = await prisma.projectScope.findMany({
    where: { projectId: id },
    include: {
      timeEntries: {
        include: {
          user: { select: { email: true, profile: true } },
        },
        orderBy: { date: "asc" },
      },
    },
  });

  for (const scope of scopes) {
    if (!scope.costPerHour) continue;
    for (const entry of scope.timeEntries) {
      const name =
        (entry.user.profile as { firstName?: string; lastName?: string } | null)
          ?.firstName ?? entry.user.email;
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

  // ── 5. Shipment costs ─────────────────────────────────────────────────────────
  const shipments = await prisma.shipment.findMany({
    where: { projectId: id, cost: { gt: 0 } },
    orderBy: { createdAt: "asc" },
  });

  for (const sh of shipments) {
    const cost = Number(sh.cost ?? 0);
    if (!cost) continue;
    rows.push({
      date: sh.createdAt.toISOString().slice(0, 10),
      category: "Shipping",
      description: sh.carrier ?? "Shipment",
      itemNumber: "",
      manufacturer: "",
      vendorOrSource: sh.carrier ?? "",
      qty: 1,
      unitCost: cost,
      total: cost,
      reference: sh.tracking ?? sh.id,
    });
  }

  // ── 6. Invoices ───────────────────────────────────────────────────────────────
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

  // ── Sort by date, then category ───────────────────────────────────────────────
  const order = [
    "PO Material",
    "Return Credit",
    "Inventory Allocation",
    "Labor",
    "Shipping",
    "Invoice",
  ];
  rows.sort((a, b) => {
    const dateDiff = a.date.localeCompare(b.date);
    if (dateDiff !== 0) return dateDiff;
    return order.indexOf(a.category) - order.indexOf(b.category);
  });

  // ── Build CSV ─────────────────────────────────────────────────────────────────
  const header =
    "Date,Category,Description,Item #,Manufacturer,Vendor / Source,Qty,Unit Cost,Total,Reference";
  const csvLines = [header, ...rows.map(csvRow)];
  const csv = csvLines.join("\n");

  const filename = `${project.name.replace(/[^a-z0-9]/gi, "_")}_financial_report.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
