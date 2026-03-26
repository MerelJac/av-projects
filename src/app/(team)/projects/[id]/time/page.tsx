import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import TimeCardEditor from "./TimeCardEditor";

export default async function TimeCardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = await params;
  const session = await getServerSession(authOptions);

  const [project, scopes, teamUsers, projectBoms] = await Promise.all([
    prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        customer: { select: { name: true } },
      },
    }),
    prisma.projectScope.findMany({
      where: { projectId },
      include: {
        item: {
          select: { id: true, itemNumber: true, manufacturer: true },
        },
        timeEntries: {
          include: {
            user: { select: { id: true, email: true, profile: true } },
          },
          orderBy: { date: "desc" },
        },
        invoiceLines: {
          select: { id: true, quantity: true, price: true },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.user.findMany({
      where: { role: "TEAM" },
      include: { profile: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.billOfMaterials.findMany({
      where: { projectId },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  if (!project) return notFound();

  return (
    <TimeCardEditor
      project={project}
      scopes={scopes}
      teamUsers={teamUsers}
      currentUserId={session?.user?.id}
      projectBoms={projectBoms}
    />
  );
}
