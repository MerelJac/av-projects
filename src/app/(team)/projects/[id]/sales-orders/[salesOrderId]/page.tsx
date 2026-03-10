// src/app/(team)/projects/[id]/sales-orders/[salesOrderId]/page.tsx
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

// Plain serializable version safe to pass to Client Components
export type SalesOrderForClient = Omit<SalesOrderWithDetails, "lines"> & {
  lines: Array<
    Omit<SalesOrderWithDetails["lines"][number], "price" | "cost"> & {
      price: number;
      cost: number | null;
    }
  >;
};

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

  // Serialize Decimal → number so Next.js can pass it to the Client Component
  const serialized: SalesOrderForClient = {
    ...salesOrder,
    lines: salesOrder.lines.map((l) => ({
      ...l,
      price: l.price.toNumber(),
      cost: l.cost?.toNumber() ?? null,
    })),
  };

  return (
    <div className="bg-[#F7F6F3]">
      <SalesOrderEditor salesOrder={serialized} projectId={id} />
      <div className="max-w-5xl mx-auto px-6 pb-10">
        <NotesPanel
          documentType="SALES_ORDER"
          documentId={salesOrder.id}
          currentUserId={currentUserId}
        />
      </div>
    </div>
  );
}