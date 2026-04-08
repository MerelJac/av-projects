import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import POEditor from "./POEditor";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

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
        buyer: { select: { id: true, profile: { select: { firstName: true, lastName: true } } } },
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
      select: { id: true, profile: { select: { firstName: true, lastName: true } } },
      orderBy: { profile: { firstName: "asc" } },
    }),
  ]);

  if (!po || po.projectId !== id) return notFound();

  const poSerialized = {
    ...po,
    creditLimit: po.creditLimit != null ? Number(po.creditLimit) : null,
    shipments: po.shipments.map((s) => ({
      ...s,
      cost: s.cost != null ? Number(s.cost) : null,
    })),
    returns: po.returns,
  };

  return <POEditor po={poSerialized} projectId={id} users={users} currentUserId={currentUserId} />;
}
