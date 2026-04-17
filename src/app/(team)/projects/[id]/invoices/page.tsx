import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import InvoicesEditor from "./InvoicesEditor";

export default async function InvoicesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = await params;
  const session = await getServerSession(authOptions);

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, name: true, customer: { select: { name: true } } },
  });

  if (!project) return notFound();

  const invoices = await prisma.invoice.findMany({
    where: { projectId },
    include: {
      lines: true,
      quote: { select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    
    <InvoicesEditor
      project={project}
      invoices={invoices}
      currentUserId={session?.user?.id}
    />
  );
}
