import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import BOMEditor from "../BomEditor";
import { BOMItem, BOMType } from "@/types/bom";

export default async function BOMPage({
  params,
}: {
  params: Promise<{ id: string; bomId: string }>;
}) {
  const { id, bomId } = await params;

  const bom = await prisma.billOfMaterials.findUnique({
    where: { id: bomId },
    include: {
      project: { include: { customer: true } },
      lines: { include: { item: true } },
      quotes: {
        orderBy: { createdAt: "desc" },
        select: { id: true, status: true, total: true, createdAt: true },
      },
    },
  });

  if (!bom || bom.project.id !== id) return notFound();

  const [items, customerPrices] = await Promise.all([
    prisma.item.findMany({
      where: { active: true },
      orderBy: { itemNumber: "asc" },
      select: {
        id: true,
        itemNumber: true,
        manufacturer: true,
        price: true,
        cost: true,
        category: true,
        type: true,
      },
    }),
    prisma.customerItemPrice.findMany({
      where: { customerId: bom.project.customerId },
      select: { itemId: true, price: true },
    }),
  ]);

  return (
    <BOMEditor
      bom={bom as BOMType}
      items={items as BOMItem[]}
      customerPrices={Object.fromEntries(
        customerPrices.map((cp) => [cp.itemId, cp.price]),
      )}
      projectId={id}
    />
  );
}
