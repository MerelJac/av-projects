// src/app/projects/[id]/sales-orders/[salesOrderId]/page.tsx
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import SalesOrderEditor from "./SalesOrderEditor";
import NotesPanel from "@/app/components/NotesPanel";

export type SalesOrderWithDetails = Prisma.SalesOrderGetPayload<{
  include: {
    customer: true;
    project: true;
    quote: { select: { id: true } };
    lines: { include: { item: true } };
  };
}>;

export default async function SalesOrderPage({
  params,
}: {
  params: Promise<{ id: string; salesOrderId: string }>;
}) {
  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id;
  const { id, salesOrderId } = await params;

  const salesOrder = await prisma.salesOrder.findUnique({
    where: { id: salesOrderId },
    include: {
      customer: true,
      project: true,
      quote: { select: { id: true } },
      lines: { include: { item: true }, orderBy: { id: "asc" } },
    },
  });

  if (!salesOrder || salesOrder.projectId !== id) return notFound();

  return (
    <div className="bg-[#F7F6F3]">
      <SalesOrderEditor salesOrder={salesOrder} projectId={id} />
      <div className="max-w-5xl mx-auto px-6 pb-10">
        <NotesPanel
          documentType="CHANGE_ORDER" // reuse existing enum value for SO notes
          documentId={salesOrder.id}
          currentUserId={currentUserId}
        />
      </div>
    </div>
  );
}
