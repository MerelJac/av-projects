import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import PODetailClient from "./PODetailClient";

export default async function PODetailPage({
  params,
}: {
  params: Promise<{ id: string; salesOrderId: string; poId: string }>;
}) {
  const { id, salesOrderId, poId } = await params;
  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id;

  const po = await prisma.purchaseOrder.findUnique({
    where: { id: poId },
    include: {
      lines: {
        include: { item: true, salesOrderLine: true },
        orderBy: { id: "asc" },
      },
      shipments: {
        include: { item: true },
        orderBy: { createdAt: "desc" },
      },
      salesOrder: {
        include: { customer: true, project: true },
      },
    },
  });

  if (!po || po.projectId !== id || po.salesOrderId !== salesOrderId) {
    return notFound();
  }

  return (
    <PODetailClient
      po={po}
      projectId={id}
      salesOrderId={salesOrderId}
      currentUserId={currentUserId}
    />
  );
}