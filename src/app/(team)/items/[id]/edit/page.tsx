// src/app/(team)/items/[id]/edit/page.tsx
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ItemEditForm from "./ItemEditForm";

export default async function ItemEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const item = await prisma.item.findUnique({ where: { id } });
  if (!item) return notFound();

  return (
    <div className="min-h-screen bg-[#F7F6F3]">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <Link
          href={`/items/${id}`}
          className="flex items-center gap-2 text-sm text-[#666] hover:text-[#111] mb-6 transition-colors"
        >
          <ArrowLeft size={15} />
          {item.itemNumber}
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#111] tracking-tight">Edit Item</h1>
          <p className="text-sm text-[#999] mt-1 font-mono">{item.itemNumber}</p>
        </div>

        <ItemEditForm item={{
          id: item.id,
          itemNumber: item.itemNumber,
          manufacturer: item.manufacturer,
          cost: item.cost,
          price: item.price,
          lastSoldPrice: item.lastSoldPrice,
          category: item.category,
          type: item.type,
          active: item.active,
          approved: item.approved,
          eolDate: item.eolDate ? item.eolDate.toISOString().split("T")[0] : null,
          description: item.description,
          unit: item.unit,
        }} />
      </div>
    </div>
  );
}