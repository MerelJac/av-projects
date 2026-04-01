import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  FileText,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Ban,
  Percent,
  List,
  DollarSign,
} from "lucide-react";

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  DRAFT:    { label: "Draft",    color: "bg-gray-100 text-gray-600",     icon: <FileText size={11} /> },
  SENT:     { label: "Sent",     color: "bg-blue-100 text-blue-700",     icon: <Send size={11} /> },
  PENDING:  { label: "Pending",  color: "bg-amber-100 text-amber-700",   icon: <Clock size={11} /> },
  PAID:     { label: "Paid",     color: "bg-green-100 text-green-700",   icon: <CheckCircle2 size={11} /> },
  REJECTED: { label: "Rejected", color: "bg-red-100 text-red-600",       icon: <XCircle size={11} /> },
  REVISED:  { label: "Revised",  color: "bg-purple-100 text-purple-700", icon: <RefreshCw size={11} /> },
  VOID:     { label: "Void",     color: "bg-gray-100 text-gray-400",     icon: <Ban size={11} /> },
};

const STATUS_ORDER = ["DRAFT", "SENT", "PENDING", "PAID", "REJECTED", "REVISED", "VOID"] as const;

const fmt = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default async function InvoicesPage() {
  const invoices = await prisma.invoice.findMany({
    include: {
      project: {
        select: {
          id: true,
          name: true,
          customer: { select: { name: true } },
        },
      },
      quote: { select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const statusCounts = STATUS_ORDER.reduce(
    (acc, s) => ({ ...acc, [s]: invoices.filter((i) => i.status === s).length }),
    {} as Record<string, number>,
  );

  const totalInvoiced = invoices
    .filter((i) => i.status !== "VOID")
    .reduce((s, i) => s + (i.amount ?? 0), 0);

  const totalPaid = invoices
    .filter((i) => i.status === "PAID")
    .reduce((s, i) => s + (i.amount ?? 0), 0);

  const totalOutstanding = invoices
    .filter((i) => ["SENT", "PENDING"].includes(i.status))
    .reduce((s, i) => s + (i.amount ?? 0), 0);

  return (
    <div className="bg-[#F7F6F3] min-h-screen">
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#111] tracking-tight">Invoices</h1>
            <p className="text-sm text-[#999] mt-1">{invoices.length} total</p>
          </div>

          {/* Financial summary */}
          <div className="flex items-center gap-5">
            <div className="text-right">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#999]">Invoiced</p>
              <p className="text-lg font-bold text-[#111]">${fmt(totalInvoiced)}</p>
            </div>
            <div className="w-px h-10 bg-[#E5E3DE]" />
            <div className="text-right">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#999]">Outstanding</p>
              <p className="text-lg font-bold text-amber-600">${fmt(totalOutstanding)}</p>
            </div>
            <div className="w-px h-10 bg-[#E5E3DE]" />
            <div className="text-right">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#999]">Collected</p>
              <p className="text-lg font-bold text-green-600">${fmt(totalPaid)}</p>
            </div>
          </div>
        </div>

        {/* Status summary cards */}
        <div className="grid grid-cols-7 gap-3 mb-8">
          {STATUS_ORDER.map((status) => {
            const cfg = STATUS_CONFIG[status];
            return (
              <div key={status} className="bg-white border border-[#E5E3DE] rounded-2xl p-3.5">
                <div className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full w-fit mb-2 ${cfg.color}`}>
                  {cfg.icon}
                  {cfg.label}
                </div>
                <p className="text-2xl font-bold text-[#111]">{statusCounts[status]}</p>
              </div>
            );
          })}
        </div>

        {/* Table */}
        <div className="bg-white border border-[#E5E3DE] rounded-2xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#F0EEE9] flex items-center gap-2">
            <DollarSign size={14} className="text-[#999]" />
            <h3 className="text-sm font-semibold text-[#111]">All Invoices</h3>
          </div>

          {invoices.length === 0 ? (
            <p className="px-5 py-16 text-sm text-[#bbb] text-center">
              No invoices yet — create one from a quote.
            </p>
          ) : (
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-[#F0EEE9]">
                  <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-[#999] px-5 py-3">
                    Invoice
                  </th>
                  <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-[#999] px-3 py-3">
                    Customer
                  </th>
                  <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-[#999] px-3 py-3">
                    Project
                  </th>
                  <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-[#999] px-3 py-3">
                    Status
                  </th>
                  <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-[#999] px-3 py-3">
                    Type
                  </th>
                  <th className="text-right text-[10px] font-semibold uppercase tracking-widest text-[#999] px-3 py-3">
                    Amount
                  </th>
                  <th className="text-right text-[10px] font-semibold uppercase tracking-widest text-[#999] px-3 py-3">
                    Due
                  </th>
                  <th className="text-right text-[10px] font-semibold uppercase tracking-widest text-[#999] px-5 py-3">
                    Issued
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => {
                  const cfg = STATUS_CONFIG[inv.status] ?? STATUS_CONFIG.DRAFT;
                  const href = inv.project
                    ? `/projects/${inv.project.id}/invoices`
                    : "#";

                  const isOverdue =
                    inv.dueDate &&
                    new Date(inv.dueDate) < new Date() &&
                    !["PAID", "VOID"].includes(inv.status);

                  return (
                    <tr
                      key={inv.id}
                      className="border-b border-[#F7F6F3] last:border-0 hover:bg-[#FAFAF9] transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <Link
                          href={href}
                          className="text-xs font-mono font-semibold text-[#111] hover:underline"
                        >
                          {inv.invoiceNumber ?? inv.id.toUpperCase()}
                        </Link>
                        <p className="text-[10px] text-[#bbb] mt-0.5">
                          {new Date(inv.createdAt).toLocaleDateString()}
                        </p>
                      </td>

                      <td className="px-3 py-3.5 text-sm text-[#111]">
                        {inv.customerName ?? inv.project?.customer.name ?? (
                          <span className="text-[#bbb]">—</span>
                        )}
                      </td>

                      <td className="px-3 py-3.5 text-sm text-[#666]">
                        {inv.project ? (
                          <Link
                            href={`/projects/${inv.project.id}`}
                            className="hover:underline"
                          >
                            {inv.project.name}
                          </Link>
                        ) : (
                          <span className="text-[#bbb]">—</span>
                        )}
                      </td>

                      <td className="px-3 py-3.5">
                        <span
                          className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full w-fit ${cfg.color}`}
                        >
                          {cfg.icon}
                          {cfg.label}
                        </span>
                      </td>

                      <td className="px-3 py-3.5">
                        <span className="flex items-center gap-1 text-[10px] text-[#999]">
                          {inv.chargeType === "PERCENTAGE" ? (
                            <>
                              <Percent size={10} />
                              {inv.chargePercent}%
                            </>
                          ) : (
                            <>
                              <List size={10} />
                              Items
                            </>
                          )}
                        </span>
                      </td>

                      <td className="px-3 py-3.5 text-right text-sm font-semibold text-[#111]">
                        {inv.amount != null ? `$${fmt(inv.amount)}` : (
                          <span className="text-[#bbb] font-normal">—</span>
                        )}
                      </td>

                      <td className="px-3 py-3.5 text-right">
                        {inv.dueDate ? (
                          <span className={`text-sm ${isOverdue ? "text-red-600 font-semibold" : "text-[#666]"}`}>
                            {new Date(inv.dueDate).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                            {isOverdue && (
                              <span className="block text-[10px] font-semibold text-red-500">Overdue</span>
                            )}
                          </span>
                        ) : (
                          <span className="text-[#bbb] text-sm">—</span>
                        )}
                      </td>

                      <td className="px-5 py-3.5 text-right text-xs text-[#999]">
                        {inv.issuedAt
                          ? new Date(inv.issuedAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : <span className="text-[#bbb]">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
