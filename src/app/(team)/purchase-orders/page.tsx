import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Clock, Send, AlertCircle, CheckCircle2, Package } from "lucide-react";

const STATUS_CONFIG = {
  DRAFT: { label: "Draft", color: "text-gray-500 bg-gray-100", icon: <Clock size={11} /> },
  SENT: { label: "Sent", color: "text-blue-600 bg-blue-50", icon: <Send size={11} /> },
  PARTIALLY_RECEIVED: { label: "Partial", color: "text-amber-600 bg-amber-50", icon: <AlertCircle size={11} /> },
  RECEIVED: { label: "Received", color: "text-green-600 bg-green-50", icon: <CheckCircle2 size={11} /> },
};

export default async function PurchaseOrdersPage() {
  const pos = await prisma.purchaseOrder.findMany({
    include: {
      project: true,
      salesOrder: { include: { customer: true } },
      lines: { include: { item: true } },
      shipments: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const counts = {
    DRAFT: pos.filter((p) => p.status === "DRAFT").length,
    SENT: pos.filter((p) => p.status === "SENT").length,
    PARTIALLY_RECEIVED: pos.filter((p) => p.status === "PARTIALLY_RECEIVED").length,
    RECEIVED: pos.filter((p) => p.status === "RECEIVED").length,
  };

  return (
    <div className="bg-[#F7F6F3]">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#111] tracking-tight">Purchase Orders</h1>
          <p className="text-sm text-[#999] mt-1">{pos.length} total</p>
        </div>

        {/* Status summary */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {(Object.entries(counts) as [keyof typeof STATUS_CONFIG, number][]).map(([status, count]) => {
            const cfg = STATUS_CONFIG[status];
            return (
              <div key={status} className="bg-white border border-[#E5E3DE] rounded-2xl p-4">
                <div className={`flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full w-fit ${cfg.color} mb-2`}>
                  {cfg.icon}
                  {cfg.label}
                </div>
                <p className="text-2xl font-bold text-[#111]">{count}</p>
              </div>
            );
          })}
        </div>

        {/* PO table */}
        <div className="bg-white border border-[#E5E3DE] rounded-2xl overflow-x-auto">
          <div className="px-5 py-3.5 border-b border-[#F0EEE9] flex items-center gap-2">
            <Package size={14} className="text-[#999]" />
            <h3 className="text-sm font-semibold text-[#111]">All Purchase Orders</h3>
          </div>

          {pos.length === 0 ? (
            <p className="px-5 py-12 text-sm text-[#bbb] text-center">No purchase orders yet</p>
          ) : (
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-[#F0EEE9]">
                  <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-[#999] px-5 py-3">PO</th>
                  <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-[#999] px-3 py-3">Vendor</th>
                  <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-[#999] px-3 py-3">Customer</th>
                  <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-[#999] px-3 py-3">Project</th>
                  <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-[#999] px-3 py-3">Status</th>
                  <th className="text-right text-[10px] font-semibold uppercase tracking-widest text-[#999] px-3 py-3">Items</th>
                  <th className="text-right text-[10px] font-semibold uppercase tracking-widest text-[#999] px-3 py-3">Received</th>
                  <th className="text-right text-[10px] font-semibold uppercase tracking-widest text-[#999] px-5 py-3">Cost</th>
                </tr>
              </thead>
              <tbody>
                {pos.map((po) => {
                  const cfg = STATUS_CONFIG[po.status];
                  const totalQty = po.lines.reduce((s, l) => s + l.quantity, 0);
                  const receivedQty = po.lines.reduce((s, l) => s + l.receivedQuantity, 0);
                  const totalCost = po.lines.reduce((s, l) => s + l.cost * l.quantity, 0);
                  const soId = po.salesOrderId;
                  const projId = po.projectId;
                  // const href = soId && projId
                  //   ? `/projects/${projId}/sales-orders/${soId}/purchase-orders/${po.id}`
                  //   : "#";
                    const href =  projId
                    ? `/projects/${projId}/purchase-orders/${po.id}`
                    : "#";

                  return (
                    <tr key={po.id} className="border-b border-[#F7F6F3] last:border-0 hover:bg-[#FAFAF9] transition-colors">
                      <td className="px-5 py-3.5">
                        <Link href={href} className="text-xs font-mono font-semibold text-[#111] hover:underline">
                          PO-{po.id.slice(0, 8).toUpperCase()}
                        </Link>
                        <p className="text-[10px] text-[#bbb] mt-0.5">
                          {po.createdAt.toLocaleDateString()}
                        </p>
                      </td>
                      <td className="px-3 py-3.5 text-sm text-[#111] font-semibold">{po.vendor}</td>
                      <td className="px-3 py-3.5 text-sm text-[#666]">
                        {po.salesOrder?.customer.name ?? "—"}
                      </td>
                      <td className="px-3 py-3.5 text-sm text-[#666]">
                        {po.project ? (
                          <Link href={`/projects/${po.project.id}`} className="hover:underline">
                            {po.project.name}
                          </Link>
                        ) : "—"}
                      </td>
                      <td className="px-3 py-3.5">
                        <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full w-fit ${cfg.color}`}>
                          {cfg.icon}
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-right text-sm text-[#666]">{po.lines.length}</td>
                      <td className="px-3 py-3.5 text-right">
                        <span className={`text-sm font-semibold ${receivedQty >= totalQty && totalQty > 0 ? "text-green-600" : receivedQty > 0 ? "text-amber-600" : "text-[#999]"}`}>
                          {receivedQty}/{totalQty}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right text-sm text-[#666]">
                        ${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
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