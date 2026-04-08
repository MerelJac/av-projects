import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";

type ReportRow = {
  date: string;
  category: string;
  description: string;
  itemNumber: string;
  manufacturer: string;
  vendorOrSource: string;
  qty: number;
  unitCost: number;
  total: number;
  reference: string;
};

const CATEGORY_STYLES: Record<string, string> = {
  "PO Material": "bg-blue-50 text-blue-700",
  "Return Credit": "bg-green-50 text-green-700",
  "Inventory Allocation": "bg-purple-50 text-purple-700",
  Labor: "bg-amber-50 text-amber-700",
  Shipping: "bg-gray-100 text-gray-600",
  Invoice: "bg-[#111] text-white",
};

async function getReportRows(projectId: string): Promise<ReportRow[]> {
  const rows: ReportRow[] = [];

  // ── PO lines ──────────────────────────────────────────────────────────────
  const pos = await prisma.purchaseOrder.findMany({
    where: { projectId, status: { not: "CANCELLED" } },
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

  // ── PO return credits ─────────────────────────────────────────────────────
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prismaAny = prisma as any;
    const returns = await prismaAny.purchaseOrderReturn.findMany({
      where: { status: "CREDITED", po: { projectId } },
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
    // returns table not yet migrated
  }

  // ── Inventory allocations ─────────────────────────────────────────────────
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prismaAny = prisma as any;
    const allocations = await prismaAny.inventoryMovement.findMany({
      where: { type: "BOM_ALLOCATION", bomLine: { bom: { projectId } } },
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

  // ── Labor ─────────────────────────────────────────────────────────────────
  const scopes = await prisma.projectScope.findMany({
    where: { projectId },
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
      const profile = entry.user.profile as
        | { firstName?: string; lastName?: string }
        | null;
      const name = profile?.firstName
        ? `${profile.firstName}${profile.lastName ? ` ${profile.lastName}` : ""}`
        : entry.user.email;
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

  // ── Shipping ──────────────────────────────────────────────────────────────
  const shipments = await prisma.shipment.findMany({
    where: { projectId, cost: { gt: 0 } },
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
      reference: sh.trackingNumber ?? sh.id,
    });
  }

  // ── Invoices ──────────────────────────────────────────────────────────────
  const invoices = await prisma.invoice.findMany({
    where: { projectId, status: { not: "VOID" } },
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

  // Sort by date, then category order
  const order = [
    "PO Material",
    "Return Credit",
    "Inventory Allocation",
    "Labor",
    "Shipping",
    "Invoice",
  ];
  rows.sort((a, b) => {
    const d = a.date.localeCompare(b.date);
    if (d !== 0) return d;
    return order.indexOf(a.category) - order.indexOf(b.category);
  });

  return rows;
}

function fmt(n: number) {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default async function FinancialReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    select: { name: true, customer: { select: { name: true } } },
  });
  if (!project) return notFound();

  const rows = await getReportRows(id);

  const totalCosts = rows
    .filter((r) => r.total > 0 && r.category !== "Invoice")
    .reduce((s, r) => s + r.total, 0);
  const totalCredits = rows
    .filter((r) => r.total < 0)
    .reduce((s, r) => s + r.total, 0);
  const netCost = totalCosts + totalCredits;
  const totalInvoiced = rows
    .filter((r) => r.category === "Invoice")
    .reduce((s, r) => s + r.total, 0);

  // Group totals by category
  const byCategory: Record<string, number> = {};
  for (const row of rows) {
    byCategory[row.category] = (byCategory[row.category] ?? 0) + row.total;
  }

  return (
    <div className="bg-[#F7F6F3] min-h-screen">
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <Link
              href={`/projects/${id}`}
              className="flex items-center gap-1.5 text-xs text-[#999] hover:text-[#111] mb-3 transition-colors"
            >
              <ArrowLeft size={12} />
              {project.customer.name} · {project.name}
            </Link>
            <h1 className="text-2xl font-bold text-[#111] tracking-tight">
              Financial Report
            </h1>
            <p className="text-sm text-[#999] mt-1">{rows.length} line items</p>
          </div>
          <a
            href={`/api/projects/${id}/financial-report`}
            download
            className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl bg-[#111] text-white hover:bg-[#333] transition-colors"
          >
            <Download size={13} />
            Export CSV
          </a>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white border border-[#E5E3DE] rounded-2xl px-5 py-4">
            <p className="text-xs text-[#999] uppercase tracking-widest mb-1">
              Total Costs
            </p>
            <p className="text-lg font-bold text-[#111]">${fmt(totalCosts)}</p>
          </div>
          <div className="bg-white border border-[#E5E3DE] rounded-2xl px-5 py-4">
            <p className="text-xs text-[#999] uppercase tracking-widest mb-1">
              Total Credits
            </p>
            <p className="text-lg font-bold text-green-600">
              {totalCredits < 0 ? "-" : ""}${fmt(Math.abs(totalCredits))}
            </p>
          </div>
          <div className="bg-white border border-[#E5E3DE] rounded-2xl px-5 py-4">
            <p className="text-xs text-[#999] uppercase tracking-widest mb-1">
              Net Cost
            </p>
            <p className="text-lg font-bold text-[#111]">${fmt(netCost)}</p>
          </div>
          <div className="bg-white border border-[#E5E3DE] rounded-2xl px-5 py-4">
            <p className="text-xs text-[#999] uppercase tracking-widest mb-1">
              Invoiced
            </p>
            <p className="text-lg font-bold text-[#111]">
              ${fmt(totalInvoiced)}
            </p>
          </div>
        </div>

        {/* Category breakdown */}
        {Object.keys(byCategory).length > 1 && (
          <div className="bg-white border border-[#E5E3DE] rounded-2xl px-6 py-4">
            <p className="text-xs font-semibold text-[#999] uppercase tracking-widest mb-3">
              By Category
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {Object.entries(byCategory).map(([cat, total]) => (
                <div key={cat} className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${CATEGORY_STYLES[cat] ?? "bg-gray-100 text-gray-600"}`}
                  >
                    {cat}
                  </span>
                  <span
                    className={`text-sm font-semibold ${total < 0 ? "text-green-600" : "text-[#111]"}`}
                  >
                    {total < 0 ? "-" : ""}${fmt(Math.abs(total))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Line items table */}
        <div className="bg-white border border-[#E5E3DE] rounded-2xl overflow-hidden">
          {rows.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="text-sm text-[#bbb]">No financial activity yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#F0EEE9] bg-[#FAFAF9]">
                    <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-[#999] px-4 py-3 w-28">
                      Date
                    </th>
                    <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-[#999] px-3 py-3 w-36">
                      Category
                    </th>
                    <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-[#999] px-3 py-3">
                      Description
                    </th>
                    <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-[#999] px-3 py-3 w-32">
                      Item #
                    </th>
                    <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-[#999] px-3 py-3 w-36">
                      Vendor / Source
                    </th>
                    <th className="text-right text-[10px] font-semibold uppercase tracking-widest text-[#999] px-3 py-3 w-16">
                      Qty
                    </th>
                    <th className="text-right text-[10px] font-semibold uppercase tracking-widest text-[#999] px-3 py-3 w-24">
                      Unit Cost
                    </th>
                    <th className="text-right text-[10px] font-semibold uppercase tracking-widest text-[#999] px-4 py-3 w-28">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr
                      key={i}
                      className="border-b border-[#F7F6F3] last:border-0 hover:bg-[#FAFAF9] transition-colors"
                    >
                      <td className="px-4 py-3 text-xs text-[#999] tabular-nums">
                        {row.date}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${CATEGORY_STYLES[row.category] ?? "bg-gray-100 text-gray-600"}`}
                        >
                          {row.category}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-[#111]">
                        <p className="text-sm">{row.description}</p>
                        {row.manufacturer && (
                          <p className="text-[10px] text-[#bbb]">
                            {row.manufacturer}
                          </p>
                        )}
                        {row.reference && row.reference !== row.description && (
                          <p className="text-[10px] text-[#bbb]">
                            {row.reference}
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-3 text-xs font-mono text-[#666]">
                        {row.itemNumber}
                      </td>
                      <td className="px-3 py-3 text-xs text-[#666]">
                        {row.vendorOrSource}
                      </td>
                      <td className="px-3 py-3 text-right text-sm tabular-nums text-[#666]">
                        {row.qty}
                      </td>
                      <td className="px-3 py-3 text-right text-sm tabular-nums text-[#666]">
                        {row.unitCost > 0 ? `$${fmt(row.unitCost)}` : "—"}
                      </td>
                      <td
                        className={`px-4 py-3 text-right text-sm font-semibold tabular-nums ${row.total < 0 ? "text-green-600" : "text-[#111]"}`}
                      >
                        {row.total < 0 ? "-" : ""}${fmt(Math.abs(row.total))}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-[#E5E3DE] bg-[#FAFAF9]">
                    <td
                      colSpan={7}
                      className="px-4 py-3 text-xs font-semibold text-[#666] uppercase tracking-widest"
                    >
                      Net Cost
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-[#111] tabular-nums">
                      ${fmt(netCost)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
