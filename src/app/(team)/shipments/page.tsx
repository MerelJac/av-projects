import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Truck, CheckCircle2, Clock } from "lucide-react";
import AllShipments from "@/app/components/shipments/AllShipments";

export default async function ShipmentsPage() {
  const shipments = await prisma.shipment.findMany({
    include: {
      project: true,
      item: true,
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
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#111] tracking-tight">
            Shipments
          </h1>
          <p className="text-sm text-[#999] mt-1">{shipments.length} total</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white border border-[#E5E3DE] rounded-2xl p-4">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#999] mb-2">
              <Truck size={12} /> All
            </div>
            <p className="text-2xl font-bold text-[#111]">{shipments.length}</p>
          </div>
          <div className="bg-white border border-[#E5E3DE] rounded-2xl p-4">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 mb-2">
              <Clock size={12} /> In Transit
            </div>
            <p className="text-2xl font-bold text-[#111]">{inTransit}</p>
          </div>
          <div className="bg-white border border-[#E5E3DE] rounded-2xl p-4">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-green-600 mb-2">
              <CheckCircle2 size={12} /> Received
            </div>
            <p className="text-2xl font-bold text-[#111]">{received}</p>
          </div>
        </div>

        {/* Shipments table */}
        <AllShipments shipments={shipments} />
      </div>
    </div>
  );
}
