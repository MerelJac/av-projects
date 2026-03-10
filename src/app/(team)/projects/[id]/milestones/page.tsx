// make this a compnent

import MilestonesPanel from "@/app/components/MilestonesPanel";
import notFound from "@/app/not-found";
import { prisma } from "@/lib/prisma";

export default async function ProjectMilestonesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      customer: true,
      shipments: true,
      timeEntries: true,
      purchaseOrders: true,
      milestones: { orderBy: { dueDate: "asc" } },
      quotes: {
        include: { lines: { include: { item: true, bundle: true } } },
        orderBy: { createdAt: "desc" },
      },
      changeOrders: { orderBy: { createdAt: "desc" } },
      boms: {
        include: { lines: { include: { item: true } }, quotes: true },
        orderBy: { createdAt: "desc" },
      },
      scopes: {
        include: {
          timeEntries: {
            include: { user: { include: { profile: true } } },
            orderBy: { date: "desc" },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!project) return notFound();
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-[#111] mb-6">Milestones</h1>
      <MilestonesPanel
        projectId={project.id}
        initialMilestones={project.milestones.map((m) => ({
          ...m,
          dueDate: m.dueDate?.toISOString() ?? null,
        }))}
      />
    </div>
  );
}
