import { ShipmentWithRelations } from "@/types/shipment";
import { CheckCircle2, Clock, Truck } from "lucide-react";
import Link from "next/link";
export default async function AllShipments({
  shipments,
}: {
  shipments: ShipmentWithRelations[];
}) {
  return (
    <div className="bg-white border border-[#E5E3DE] rounded-2xl overflow-x-auto">
      <div className="px-5 py-3.5 border-b border-[#F0EEE9] flex items-center gap-2">
        <Truck size={14} className="text-[#999]" />
        <h3 className="text-sm font-semibold text-[#111]">All Shipments</h3>
      </div>

      {shipments.length === 0 ? (
        <p className="px-5 py-12 text-sm text-[#bbb] text-center">
          No shipments logged yet
        </p>
      ) : (
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="border-b border-[#F0EEE9]">
              <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-[#999] px-5 py-3">
                Date
              </th>
              <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-[#999] px-3 py-3">
                Project
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
              <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-[#999] px-3 py-3">
                Shipping Cost
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
                s.projectId && s.purchaseOrderId
                  ? `/projects/${s.projectId}/purchase-orders/${s.purchaseOrderId}`
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
                  <td className="px-3 py-3.5">
                    <Link
                      href={`/projects/${s.project.id}`}
                      className="text-sm text-[#666] hover:underline"
                    >
                      {s.project.name}
                    </Link>
                  </td>
                  <td className="px-3 py-3.5 text-sm text-[#666]">
                    {poHref ? (
                      <div className="flex flex-col gap-2">
                        <Link href={poHref} className="hover:underline">
                          {s.purchaseOrder?.vendor?.name ?? "—"}
                        </Link>
                        <Link href={poHref} className="hover:underline text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                          PO-{s.purchaseOrderId?.toUpperCase() ?? "—"}
                        </Link>
                      </div>
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
                  <td className="px-3 py-3.5 text-right text-sm text-[#111]">
                    {s.cost != null ? (
                      `$${Number(s.cost).toFixed(2)}`
                    ) : (
                      <span className="text-[#bbb]">—</span>
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
  );
}
