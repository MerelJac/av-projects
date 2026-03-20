import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import POEditor from "./POEditor";

export default async function POPage({
  params,
}: {
  params: Promise<{ id: string; poId: string }>;
}) {
  const { id, poId } = await params;

  const po = await prisma.purchaseOrder.findUnique({
    where: { id: poId },
    include: {
      vendor: { select: { id: true, name: true } },
      project: { include: { customer: true } },
      lines: { include: { item: true } },
      quote: { select: { id: true } },
      shipments: {
        include: {
          lines: { include: { item: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!po || po.projectId !== id) return notFound();

  return <POEditor po={po} projectId={id} />;
}
