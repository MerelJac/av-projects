// src/app/api/projects/[id]/sales-orders/[salesOrderId]/purchase-orders/route.ts
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { PurchaseOrderLine } from "@prisma/client";

// GET /api/projects/:id/sales-orders/:salesOrderId/purchase-orders
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; salesOrderId: string }> },
) {
  const { id: projectId, salesOrderId } = await params;

  const pos = await prisma.purchaseOrder.findMany({
    where: { salesOrderId, projectId },
    include: {
      lines: { include: { item: true, salesOrderLine: true } },
      shipments: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(pos);
}

// POST /api/projects/:id/sales-orders/:salesOrderId/purchase-orders
// Body: { vendor, notes, lines: [{ itemId, salesOrderLineId?, quantity, cost }] }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; salesOrderId: string }> },
) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET! });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, salesOrderId } = await params;
  const { vendor, notes, lines } = await req.json();

  if (!vendor || !lines?.length) {
    return NextResponse.json({ error: "vendor and lines required" }, { status: 400 });
  }

  const po = await prisma.purchaseOrder.create({
    data: {
      vendor,
      notes,
      projectId,
      salesOrderId,
      status: "DRAFT",
      lines: {
        create: lines.map((l: PurchaseOrderLine) => ({
          itemId: l.itemId,
          salesOrderLineId: l.salesOrderLineId ?? undefined,
          quantity: l.quantity,
          receivedQuantity: 0,
          cost: l.cost,
        })),
      },
    },
    include: {
      lines: { include: { item: true } },
      shipments: true,
    },
  });

  return NextResponse.json(po, { status: 201 });
}
