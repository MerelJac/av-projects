import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import POEditor from "./POEditor";
import { authOptions, hasPermission } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { Permission } from "@prisma/client";

export default async function POPage({
  params,
}: {
  params: Promise<{ id: string; poId: string }>;
}) {
  const { id, poId } = await params;

  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id;
  const [po, users] = await Promise.all([
    prisma.purchaseOrder.findUnique({
      where: { id: poId },
      include: {
        vendor: { select: { id: true, name: true } },
        project: { include: { customer: true } },
        lines: { include: { item: true } },
        quote: { select: { id: true } },
        buyer: {
          select: {
            id: true,
            profile: { select: { firstName: true, lastName: true } },
          },
        },
        shipments: {
          include: {
            lines: { include: { item: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        returns: {
          include: {
            lines: { include: { poLine: { include: { item: true } } } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    prisma.user.findMany({
      where: { role: { in: ["TEAM", "ADMIN"] } },
      select: {
        id: true,
        profile: { select: { firstName: true, lastName: true } },
      },
      orderBy: { profile: { firstName: "asc" } },
    }),
  ]);

  if (!po || po.projectId !== id) return notFound();

  const linkedSubscriptions = await prisma.projectCost.findMany({
    where: { poLink: poId, subscriptionId: { not: null } },
    include: {
      subscription: {
        include: {
          item: {
            select: {
              id: true,
              itemNumber: true,
              manufacturer: true,
              description: true,
            },
          },
        },
      },
    },
  });

  const poSerialized = {
    ...po,
    creditLimit: po.creditLimit != null ? Number(po.creditLimit) : null,
    shipments: po.shipments.map((s) => ({
      ...s,
      cost: s.cost != null ? Number(s.cost) : null,
    })),
    returns: po.returns,
  };

  const canEditPo = await hasPermission(Permission.PO_EDIT);
  const canApprovePo = await hasPermission(Permission.PO_APPROVE);
  return (
    <POEditor
      po={poSerialized}
      projectId={id}
      users={users}
      currentUserId={currentUserId}
      linkedSubscriptions={linkedSubscriptions}
      canEditPo={canEditPo}
      canApprovePo={canApprovePo}
    />
  );
}
