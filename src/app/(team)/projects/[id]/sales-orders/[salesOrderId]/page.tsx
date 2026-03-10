// src/app/(team)/projects/[id]/sales-orders/[salesOrderId]/page.tsx
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import SalesOrderEditor from "./SalesOrderEditor";
import NotesPanel from "@/app/components/NotesPanel";
import PurchaseOrdersPanel from "@/app/components/PurchaseOrderPanel";
import { POWithDetails, POWithDetailsForClient } from "@/types/purchaseOrder";

export type SalesOrderWithDetails = Prisma.SalesOrderGetPayload<{
  include: {
    customer: true;
    project: true;
    quote: { select: { id: true } };
    lines: { include: { item: true } };
  };
}>;

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

  const [salesOrder, purchaseOrders] = await Promise.all([
    prisma.salesOrder.findUnique({
      where: { id: salesOrderId },
      include: {
        customer: true,
        project: true,
        quote: { select: { id: true } },
        lines: { include: { item: true }, orderBy: { id: "asc" } },
      },
    }),
    prisma.purchaseOrder.findMany({
      where: { salesOrderId },
      include: {
        lines: { include: { item: true, salesOrderLine: true } },
        shipments: { include: { item: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!salesOrder || salesOrder.projectId !== id) return notFound();

  // Serialize Decimals for client
  const serialized: SalesOrderForClient = {
    ...salesOrder,
    lines: salesOrder.lines.map((l) => ({
      ...l,
      price: l.price.toNumber(),
      cost: l.cost?.toNumber() ?? null,
    })),
  };

  const serializedPOs: POWithDetailsForClient[] = (purchaseOrders as POWithDetails[]).map((po) => ({
    ...po,
    lines: po.lines.map((line) => ({
      ...line,
      salesOrderLine: line.salesOrderLine
        ? {
            ...line.salesOrderLine,
            price: line.salesOrderLine.price.toNumber(),
            cost: line.salesOrderLine.cost?.toNumber() ?? null,
          }
        : null,
    })),
  }));

  return (
    <div className="bg-[#F7F6F3] min-h-screen">
      <SalesOrderEditor salesOrder={serialized} projectId={id} />
      <div className="max-w-5xl mx-auto px-6 pb-10 space-y-6">
        <PurchaseOrdersPanel
          projectId={id}
          salesOrderId={salesOrderId}
          salesOrderLines={serialized.lines}
          initialPOs={serializedPOs}
        />
        <NotesPanel
          documentType="SALES_ORDER"
          documentId={salesOrder.id}
          currentUserId={currentUserId}
        />
      </div>
    </div>
  );
}
