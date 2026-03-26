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
      lines: { include: { item: true } },
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
