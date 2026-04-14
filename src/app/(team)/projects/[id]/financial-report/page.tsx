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
  taxAmount: number;
  total: number;
  reference: string;
};

const CATEGORY_STYLES: Record<string, string> = {
  "PO Material": "bg-blue-50 text-blue-700",
  "Return Credit": "bg-green-50 text-green-700",
  Labor: "bg-amber-50 text-amber-700",
  Shipping: "bg-gray-100 text-gray-600",
  Invoice: "bg-[#111] text-white",
};

export const INVOICE_STYLES: Record<string, string> = {
  PAID: "bg-blue-50 text-blue-700",
  SENT: "bg-green-50 text-green-700",
  PENDING: "bg-green-50 text-green-700",
  VOID: "bg-amber-50 text-amber-700",
  REJECTED: "bg-amber-50 text-amber-700",
  DRAFT: "bg-gray-100 text-gray-600",
  REVISED: "bg-[#111] text-white",
};

async function getReportRows(projectId: string): Promise<ReportRow[]> {
  const rows: ReportRow[] = [];

  // ── PO materials, freight & return credits (from ProjectCost) ───────────────
  const projectCosts = await prisma.projectCost.findMany({
    where: {
      projectId,
      costType: { in: ["MATERIAL", "RETURN", "FREIGHT", "LABOR"] },
    },
    include: {
      item: {
        select: {
          itemNumber: true,
          manufacturer: true,
          description: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  // Resolve vendor names from PO IDs stored in poLink
  const poIds = [
    ...new Set(
      projectCosts.map((c) => c.poLink).filter((v): v is string => !!v),
    ),
  ];
  const vendorByPoId: Record<string, string> = {};
  if (poIds.length > 0) {
    const pos = await prisma.purchaseOrder.findMany({
      where: { id: { in: poIds } },
      select: { id: true, poNumber: true, vendor: { select: { name: true } } },
    });
    for (const po of pos) {
      vendorByPoId[po.id] = po.vendor?.name ?? "";
    }
  }

  for (const cost of projectCosts) {
    const isReturn = cost.costType === "RETURN";
    const isFreight = cost.costType === "FREIGHT";
    const isLabor = cost.costType === "LABOR";
    const qty = cost.quantity ?? 1;
    const unitCost =
      cost.unitCost ?? (qty !== 0 ? Math.abs(cost.amount) / qty : 0);
    const total = cost.amount; // negative for RETURN
    const category = isFreight
      ? "Shipping"
      : isReturn
        ? "Return Credit"
        : isLabor
          ? "Labor"
          : "PO Material";
    rows.push({
      date: cost.createdAt.toISOString().slice(0, 10),
      category,
      description: cost.item?.description ?? cost.notes ?? "",
      itemNumber: cost.item?.itemNumber ?? "",
      manufacturer: cost.item?.manufacturer ?? "",
      vendorOrSource: cost.poLink ? (vendorByPoId[cost.poLink] ?? "") : "",
      qty: isReturn ? -Math.abs(qty) : qty,
      unitCost,
      taxAmount: cost.taxAmount ?? 0,
      total,
      reference: cost.poLink ?? "",
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
      description: inv.status,
      itemNumber: "",
      manufacturer: "",
      vendorOrSource: inv.invoiceNumber ?? inv.id,
      qty: 1,
      unitCost: amt,
      total: amt,
      taxAmount: inv.taxAmount ?? 0,
      reference: inv.invoiceNumber ?? inv.id,
    });
  }

  // Sort by date, then category order
  const order = [
    "PO Material",
    "Return Credit",
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
  const totalTax = rows
    .filter((r) => r.category !== "Invoice")
    .reduce((s, r) => s + r.taxAmount, 0);
  const netCost = totalCosts + totalCredits;
  const netCostIncTax = totalCosts + totalCredits + totalTax;
  const totalInvoiced = rows
    .filter((r) => r.category === "Invoice")
    .reduce((s, r) => s + r.total, 0);
  const totalInvoicedPaid = rows
    .filter((r) => r.category === "Invoice" && r.description === "PAID")
    .reduce((s, r) => s + r.total, 0);

  // Group totals by category
  const byCategory: Record<string, number> = {};
  for (const row of rows) {
    byCategory[row.category] =
      (byCategory[row.category] ?? 0) + (row.total + row.taxAmount);
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
              Invoices
            </p>
            <p className="text-lg font-bold text-green-500">
              ${fmt(totalInvoicedPaid)} paid
            </p>
            <p className="text-lg font-bold text-[#111]">
              ${fmt(totalInvoiced)} total
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
                    <th className="text-right text-[10px] font-semibold uppercase tracking-widest text-[#999] px-3 py-3 w-24">
                      Total Incl. Tax
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
                        {row.category === "Invoice" ? (
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${INVOICE_STYLES[row.description] ?? "bg-gray-100 text-gray-600"}`}
                          >
                            {row.description}
                          </span>
                        ) : (
                          <p className="text-sm">{row.description}</p>
                        )}

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
                      <td className="px-3 py-3 text-right text-sm tabular-nums text-[#666] ">
                        {row.unitCost > 0 ? `$${fmt(row.unitCost)}` : "—"}
                      </td>

                      <td
                        className={`px-4 py-3 text-right text-sm font-semibold tabular-nums flex flex-col items-center ${row.total < 0 ? "text-green-600" : "text-[#111]"}`}
                      >
                        <span>
                          {row.total < 0 ? "-" : ""}${fmt(Math.abs(row.total))}
                        </span>
                        <span className="text-[10px] text-[#bbb]">
                          {row.taxAmount > 0
                            ? `+ $${fmt(row.taxAmount)} tax`
                            : "No Tax"}
                        </span>
                      </td>
                      <td
                        className={`px-4 py-3 text-right text-sm font-semibold tabular-nums ${row.total < 0 ? "text-green-600" : "text-[#111]"}`}
                      >
                        {row.total < 0 ? "-" : ""}$
                        {fmt(Math.abs(row.total + row.taxAmount))}
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
                    <td className="px-4 py-3 text-right text-sm font-bold text-[#111] tabular-nums">
                      ${fmt(netCostIncTax)}
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
