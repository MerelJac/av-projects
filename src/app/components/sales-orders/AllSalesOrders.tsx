import { Truck, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";
import { Prisma } from "@prisma/client";

// Derive the type directly from the Prisma query shape — no manual type needed
type SalesOrderWithRelations = Prisma.SalesOrderGetPayload<{
  include: {
    customer: true;
    project: true;
    quote: { select: { id: true } };
    lines: { include: { item: true } };
  };
}>;

const STATUS_STYLES: Record<string, string> = {
  OPEN: "text-amber-600",
  INVOICED: "text-blue-600",
  CLOSED: "text-green-600",
  CANCELLED: "text-red-500",
};

export default function AllSalesOrders({
  salesOrders,
}: {
  salesOrders: SalesOrderWithRelations[];
}) {
  return (
    <div className="bg-white border border-[#E5E3DE] rounded-2xl overflow-x-auto">
      <div className="px-5 py-3.5 border-b border-[#F0EEE9] flex items-center gap-2">
        <Truck size={14} className="text-[#999]" />
        <h3 className="text-sm font-semibold text-[#111]">All Sales Orders</h3>
      </div>

      {salesOrders.length === 0 ? (
        <p className="px-5 py-12 text-sm text-[#bbb] text-center">
          No sales orders yet
        </p>
      ) : (
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="border-b border-[#F0EEE9]">
              {["Date", "Order", "Customer", "Project", "Lines", "Total", "Status"].map(
                (h, i) => (
                  <th
                    key={h}
                    className={`text-[10px] font-semibold uppercase tracking-widest text-[#999] px-${i === 0 || i === 6 ? "5" : "3"} py-3 ${h === "Total" ? "text-right" : "text-left"}`}
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {salesOrders.map((so) => {
              const total = so.lines.reduce(
                (sum, l) => sum + Number(l.price) * l.quantity,
                0
              );

              return (
                <tr
                  key={so.id}
                  className="border-b border-[#F7F6F3] last:border-0 hover:bg-[#FAFAF9] transition-colors"
                >
                  {/* Date */}
                  <td className="px-5 py-3.5">
                    <p className="text-xs text-[#111]">
                      {so.createdAt.toLocaleDateString()}
                    </p>
                    <p className="text-[10px] text-[#bbb]">
                      {so.createdAt.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </td>

                  {/* Order ID */}
                  <td className="px-3 py-3.5">
                    <Link
                      href={`/projects/${so.projectId}/sales-orders/${so.id}`}
                      className="text-xs font-mono font-semibold text-[#111] hover:underline"
                    >
                      {so.id.slice(0, 8).toUpperCase()}
                    </Link>
                    {so.quote && (
                      <p className="text-[10px] text-[#999]">
                        Quote #{so.quote.id.slice(0, 6).toUpperCase()}
                      </p>
                    )}
                  </td>

                  {/* Customer */}
                  <td className="px-3 py-3.5 text-sm text-[#666]">
                    {so.customer.name}
                  </td>

                  {/* Project */}
                  <td className="px-3 py-3.5">
                    <Link
                      href={`/projects/${so.project.id}`}
                      className="text-sm text-[#666] hover:underline"
                    >
                      {so.project.name}
                    </Link>
                  </td>

                  {/* Lines */}
                  <td className="px-3 py-3.5">
                    {so.lines.length === 0 ? (
                      <span className="text-xs text-[#bbb]">—</span>
                    ) : (
                      <div className="space-y-0.5">
                        {so.lines.slice(0, 2).map((l) => (
                          <p key={l.id} className="text-xs text-[#444] truncate max-w-[180px]">
                            {l.quantity}× {l.item?.itemNumber ?? l.description}
                          </p>
                        ))}
                        {so.lines.length > 2 && (
                          <p className="text-[10px] text-[#999]">
                            +{so.lines.length - 2} more
                          </p>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Total */}
                  <td className="px-3 py-3.5 text-right text-sm font-semibold text-[#111]">
                    ${total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>

                  {/* Status */}
                  <td className="px-5 py-3.5">
                    <span
                      className={`flex items-center gap-1.5 text-xs font-semibold ${
                        STATUS_STYLES[so.status] ?? "text-[#999]"
                      }`}
                    >
                      {so.status === "OPEN" ? (
                        <Clock size={11} />
                      ) : (
                        <CheckCircle2 size={11} />
                      )}
                      {so.status.charAt(0) + so.status.slice(1).toLowerCase()}
                    </span>
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