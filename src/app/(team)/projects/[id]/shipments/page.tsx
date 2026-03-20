import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Truck, CheckCircle2, Clock } from "lucide-react";

export default async function ProjectShipmentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: { customer: true },
  });

  if (!project) return notFound();

  const shipments = await prisma.shipment.findMany({
    where: { projectId: id },
    include: {
      project: { include: { customer: true } },
      item: true,
      lines: { include: { item: true } },
      purchaseOrder: { select: { id: true, vendor: true } },
      salesOrder: { include: { customer: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const received = shipments.filter((s) => s.receivedAt).length;
  const inTransit = shipments.filter((s) => !s.receivedAt).length;

  return (
    <div className="bg-[#F7F6F3]">
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Back */}
        <Link
          href={`/projects/${id}`}
          className="flex items-center gap-2 text-sm text-[#666] hover:text-[#111] mb-6 transition-colors"
        >
          <ArrowLeft size={15} />
          {project.name}
        </Link>

        {/* Header */}
        <div className="mb-8">
          <p className="text-xs text-[#999] mb-1">{project.customer.name}</p>
          <h1 className="text-2xl font-bold text-[#111] tracking-tight">
            Shipments
          </h1>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white border border-[#E5E3DE] rounded-2xl p-5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#999] mb-2">
              <Truck size={12} /> All
            </div>
            <p className="text-2xl font-bold text-[#111]">{shipments.length}</p>
          </div>
          <div className="bg-white border border-[#E5E3DE] rounded-2xl p-5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 mb-2">
              <Clock size={12} /> In Transit
            </div>
            <p className="text-2xl font-bold text-[#111]">{inTransit}</p>
          </div>
          <div className="bg-white border border-[#E5E3DE] rounded-2xl p-5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-green-600 mb-2">
              <CheckCircle2 size={12} /> Received
            </div>
            <p className="text-2xl font-bold text-[#111]">{received}</p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-[#E5E3DE] rounded-2xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#F0EEE9] flex items-center gap-2">
            <Truck size={14} className="text-[#999]" />
            <h3 className="text-sm font-semibold text-[#111]">All Shipments</h3>
            {shipments.length > 0 && (
              <span className="text-xs text-[#bbb]">{shipments.length}</span>
            )}
          </div>

          {shipments.length === 0 ? (
            <p className="px-5 py-12 text-sm text-[#bbb] text-center">
              No shipments logged yet for this project
            </p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#F0EEE9]">
                  <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-[#999] px-5 py-3">
                    Date
                  </th>
                  <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-[#999] px-3 py-3">
                    Item
                  </th>
                  <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-[#999] px-3 py-3">
                    Vendor
                  </th>
                  <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-[#999] px-3 py-3">
                    Carrier
                  </th>
                  <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-[#999] px-3 py-3">
                    Tracking
                  </th>
                  <th className="text-right text-[10px] font-semibold uppercase tracking-widest text-[#999] px-3 py-3">
                    Qty
                  </th>
                  <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-[#999] px-5 py-3">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {shipments.map((s) => {
                  const poHref =
                    s.purchaseOrder && s.salesOrderId
                      ? `/projects/${id}/sales-orders/${s.salesOrderId}/purchase-orders/${s.purchaseOrder.id}`
                      : null;

                  return (
                    <tr
                      key={s.id}
                      className="border-b border-[#F7F6F3] last:border-0 hover:bg-[#FAFAF9] transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <p className="text-xs text-[#111]">
                          {s.createdAt.toLocaleDateString()}
                        </p>
                        <p className="text-[10px] text-[#bbb]">
                          {s.createdAt.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </td>
                      {/* Items — from ShipmentLines if present, fallback to legacy itemId */}
                      <td className="px-3 py-3.5">
                        {s.lines && s.lines.length > 0 ? (
                          <div className="space-y-0.5">
                            {s.lines.map((line) => (
                              <div
                                key={line.id}
                                className="flex items-center gap-1.5"
                              >
                                <span className="text-xs font-mono font-semibold text-[#111]">
                                  {line.item?.itemNumber ?? "—"}
                                </span>
                                <span className="text-[10px] text-[#999]">
                                  ×{line.quantity}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : s.item ? (
                          <>
                            <p className="text-xs font-mono font-semibold text-[#111]">
                              {s.item.itemNumber}
                            </p>
                            {s.item.manufacturer && (
                              <p className="text-[10px] text-[#999]">
                                {s.item.manufacturer}
                              </p>
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-[#bbb]">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3.5 text-sm text-[#666]">
                        {poHref ? (
                          <Link href={poHref} className="hover:underline">
                            {s.purchaseOrder?.vendor?.name ?? "—"}
                          </Link>
                        ) : (
                          (s.purchaseOrder?.vendor?.name ?? "—")
                        )}
                        
                      </td>
                      <td className="px-3 py-3.5 text-sm text-[#666]">
                        {s.carrier ?? "—"}
                      </td>
                      <td className="px-3 py-3.5">
                        {s.tracking ? (
                          <span className="text-xs font-mono bg-[#F7F6F3] px-2 py-0.5 rounded text-[#444]">
                            {s.tracking}
                          </span>
                        ) : (
                          <span className="text-xs text-[#bbb]">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3.5 text-right text-sm font-semibold text-[#111]">
                        {s.quantity}
                      </td>
                      <td className="px-5 py-3.5">
                        {s.receivedAt ? (
                          <span className="flex items-center gap-1.5 text-xs font-semibold text-green-600">
                            <CheckCircle2 size={11} />
                            {s.receivedAt.toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-600">
                            <Clock size={11} />
                            In Transit
                          </span>
                        )}
                        {s.notes && (
                          <p className="text-[10px] text-[#999] mt-0.5 max-w-[160px] truncate">
                            {s.notes}
                          </p>
                        )}
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
