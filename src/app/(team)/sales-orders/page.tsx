import { prisma } from "@/lib/prisma";
import { Truck, CheckCircle2, Clock } from "lucide-react";
import AllSalesOrders from "@/app/components/sales-orders/AllSalesOrders";
import { SalesOrderStatus } from "@prisma/client";

export default async function SalesOrdersPage() {
  const salesOrders = await prisma.salesOrder.findMany({
    include: {
      customer: true,
      project: true,
      quote: { select: { id: true } },
      lines: { include: { item: true }, orderBy: { id: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  const open = salesOrders.filter((s) => s.status === SalesOrderStatus.OPEN).length;
  const closed = salesOrders.filter((s) => s.status !== SalesOrderStatus.OPEN).length;

  return (
    <div className="bg-[#F7F6F3]">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#111] tracking-tight">Sales Orders</h1>
          <p className="text-sm text-[#999] mt-1">{salesOrders.length} total</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white border border-[#E5E3DE] rounded-2xl p-4">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#999] mb-2">
              <Truck size={12} /> All
            </div>
            <p className="text-2xl font-bold text-[#111]">{salesOrders.length}</p>
          </div>
          <div className="bg-white border border-[#E5E3DE] rounded-2xl p-4">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#999] mb-2">
              <Clock size={12} /> Open
            </div>
            <p className="text-2xl font-bold text-[#111]">{open}</p>
          </div>
          <div className="bg-white border border-[#E5E3DE] rounded-2xl p-4">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#999] mb-2">
              <CheckCircle2 size={12} /> Closed
            </div>
            <p className="text-2xl font-bold text-[#111]">{closed}</p>
          </div>
        </div>

        <AllSalesOrders salesOrders={salesOrders} />
      </div>
    </div>
  );
}