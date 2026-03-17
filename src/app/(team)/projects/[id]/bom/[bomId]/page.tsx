import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import BOMEditor from "../BomEditor";
import { BOMItem, BOMType } from "@/types/bom";
import NotesPanel from "@/app/components/NotesPanel";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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
        orderBy: { createdAt: "desc" },
        select: { id: true, status: true, total: true, createdAt: true },
      },
    },
  });

  if (!bom || bom.project.id !== id) return notFound();

  // also fetch all BOMs for this project for the modal
  const projectBoms = await prisma.billOfMaterials.findMany({
    where: { projectId: id },
    include: { _count: { select: { lines: true } } },
  });

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
    <div className=" bg-[#F7F6F3]">
      <BOMEditor
        bom={bom as BOMType}
        items={items as BOMItem[]}
        customerPrices={Object.fromEntries(
          customerPrices.map((cp) => [cp.itemId, cp.price]),
        )}
        projectId={id}
        projectBoms={projectBoms.map((b) => ({
          id: b.id,
          name: b.name,
          lineCount: b._count.lines,
          total: 0, // or compute from lines if you include them
        }))}
      />
      <div className="max-w-5xl mx-auto px-6 pb-10">
        <NotesPanel
          documentType="BILL_OF_MATERIALS"
          documentId={bomId}
          currentUserId={currentUserId}
        />
      </div>
    </div>
  );
}
