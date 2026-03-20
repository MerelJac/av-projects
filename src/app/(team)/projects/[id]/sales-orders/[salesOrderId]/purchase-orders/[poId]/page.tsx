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
      vendor: { select: { id: true, name: true } },
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
  // Serialize Decimals on salesOrderLine (price + cost)
  const serialized = {
    ...po,
    lines: po.lines.map((l) => ({
      ...l,
      salesOrderLine: l.salesOrderLine
        ? {
            ...l.salesOrderLine,
            price: l.salesOrderLine.price.toNumber(),
            cost: l.salesOrderLine.cost?.toNumber() ?? null,
          }
        : null,
    })),
  };

  return (
    <PODetailClient
      po={serialized}
      projectId={id}
      salesOrderId={salesOrderId}
      currentUserId={currentUserId}
    />
  );
}
