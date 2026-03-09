// src/app/(team)/customers/[id]/pricing/page.tsx
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import PricingEditor from "./PricingEditor";

export default async function CustomerPricing({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) return notFound();

  const items = await prisma.item.findMany({
    include: {
      customerPrices: { where: { customerId: id } },
    },
    orderBy: { itemNumber: "asc" },
  });

  return (
    <div className="min-h-screen bg-[#F7F6F3]">
      <div className="max-w-5xl mx-auto px-6 py-10">

        <Link
          href={`/customers/${id}`}
          className="flex items-center gap-2 text-sm text-[#666] hover:text-[#111] mb-6 transition-colors"
        >
          <ArrowLeft size={15} />
          {customer.name}
        </Link>

        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-xs text-[#999] mb-1">{customer.name}</p>
            <h1 className="text-2xl font-bold text-[#111] tracking-tight">
              Customer Pricing
            </h1>
            <p className="text-sm text-[#999] mt-1">
              Override list prices for this customer
            </p>
          </div>
        </div>

        <PricingEditor customerId={id} items={items.map((item) => ({
          id: item.id,
          itemNumber: item.itemNumber,
          manufacturer: item.manufacturer,
          cost: item.cost,
          price: item.price,
          active: item.active,
          approved: item.approved,
          eolDate: item.eolDate ? item.eolDate.toISOString() : null,
          customerPrice: item.customerPrices[0]?.price ?? null,
        }))} />

      </div>
    </div>
  );
}
