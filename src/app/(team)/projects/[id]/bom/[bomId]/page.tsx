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

  const [bom, items] = await Promise.all([
    prisma.billOfMaterials.findUnique({
      where: { id: bomId },
      include: {
        project: { include: { customer: true } },
        lines: {
          include: { item: true },
        },
        quotes: {
          orderBy: { createdAt: "desc" },
          select: { id: true, status: true, total: true, createdAt: true },
        },
      },
    }),
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
  ]);

  if (!bom || bom.project.id !== id) return notFound();

  return (
    <BOMEditor
      bom={bom as BOMType}
      items={items as BOMItem[]}
      projectId={id}
    />
  );
}
