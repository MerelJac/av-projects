import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import BOMEditor from "../BomEditor";
import { BOMItem, BOMLine, BOMType } from "@/types/bom";
import NotesPanel from "@/app/components/NotesPanel";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { calcBOMTotals } from "../actions";
import DuplicateBomToProjectButton from "./DuplicateBomToProjectButton";

export default async function BOMPage({
  params,
}: {
  params: Promise<{ id: string; bomId: string }>;
}) {
  const { id, bomId } = await params;
  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id;

  const bom = await prisma.billOfMaterials.findUnique({
    where: { id: bomId },
    include: {
      project: { include: { customer: true } },
      lines: { include: { item: { include: { preferredVendor: { select: { name: true } } } } } },
      quotes: {
        include: {
          quote: {
            select: { id: true, status: true, total: true, createdAt: true },
          },
        },
        orderBy: { quote: { createdAt: "desc" } },
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

  const customerPricesRecord = Object.fromEntries(
    customerPrices.map((cp) => [cp.itemId, cp.price]),
  );


  const itemIds = [...new Set(bom.lines.map((l) => l.itemId).filter(Boolean))];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prismaAny = prisma as any;
  const [allocationMovements, onHandMovements] = await Promise.all([
    prismaAny.inventoryMovement.findMany({
      where: {
        type: "BOM_ALLOCATION",
        bomLineId: { in: bom.lines.map((l) => l.id) },
      },
      select: { bomLineId: true, quantityDelta: true },
    }) as Promise<{ bomLineId: string; quantityDelta: number }[]>,
    itemIds.length > 0
      ? prismaAny.inventoryMovement.findMany({
          where: { itemId: { in: itemIds } },
          select: { itemId: true, quantityDelta: true },
        }) as Promise<{ itemId: string; quantityDelta: number }[]>
      : Promise.resolve([]),
  ]);

  const lineAllocations: Record<string, number> = {};
  for (const m of allocationMovements) {
    if (m.bomLineId) {
      lineAllocations[m.bomLineId] = (lineAllocations[m.bomLineId] ?? 0) + Math.abs(m.quantityDelta);
    }
  }

  const itemOnHand: Record<string, number> = {};
  for (const m of onHandMovements as { itemId: string; quantityDelta: number }[]) {
    itemOnHand[m.itemId] = (itemOnHand[m.itemId] ?? 0) + m.quantityDelta;
  }

  const [projectBoms, allProjects] = await Promise.all([
    prisma.billOfMaterials.findMany({
      where: { projectId: id },
      include: { lines: { include: { item: true } } },
    }),
    prisma.project.findMany({
      where: { id: { not: id } },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="bg-[#F7F6F3]">
      <BOMEditor
        bom={
          {
            ...bom,
            quotes: bom.quotes.map((q) => q.quote),
          } as BOMType
        }
        items={items as BOMItem[]}
        customerPrices={customerPricesRecord}
        projectId={id}
        lineAllocations={lineAllocations}
        itemOnHand={itemOnHand}
        projectBoms={projectBoms.map((b) => {
          const { grandTotal } = calcBOMTotals(
            b.lines as BOMLine[],
            customerPricesRecord,
            0,
          );
          return {
            id: b.id,
            name: b.name,
            lineCount: b.lines.length,
            total: grandTotal,
          };
        })}
      />
      <div className="max-w-5xl mx-auto px-6 pb-10">
        <NotesPanel
          documentType="BILL_OF_MATERIALS"
          documentId={bomId}
          currentUserId={currentUserId}
        />
      </div>
      <DuplicateBomToProjectButton
        bomId={bomId}
        bomName={bom.name}
        projects={allProjects}
      />
    </div>
  );
}
