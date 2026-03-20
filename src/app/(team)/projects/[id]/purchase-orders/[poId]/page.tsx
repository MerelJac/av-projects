import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import POEditor from "./POEditor";

export default async function POPage({
  params,
}: {
  params: Promise<{ id: string; poId: string }>;
}) {
  const { id, poId } = await params;

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
      },
    }),
    prisma.user.findMany({
      where: { role: { in: ["TEAM", "ADMIN"] } },
      select: { id: true, profile: { select: { firstName: true, lastName: true } } },
      orderBy: { profile: { firstName: "asc" } },
    }),
  ]);

  if (!po || po.projectId !== id) return notFound();

  return <POEditor po={po} projectId={id} users={users} />;
}
