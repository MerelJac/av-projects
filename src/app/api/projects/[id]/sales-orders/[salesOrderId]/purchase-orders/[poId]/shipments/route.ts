// src/app/api/projects/[id]/sales-orders/[salesOrderId]/purchase-orders/[poId]/shipments/route.ts
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// POST — log a shipment for a PO line
// Body: { itemId, quantity, carrier?, tracking?, shippedBy?, notes?, receivedAt? }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; salesOrderId: string; poId: string }> },
) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET! });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, salesOrderId, poId } = await params;
  const { itemId, quantity, carrier, tracking, shippedBy, notes, receivedAt } =
    await req.json();

  if (!quantity || quantity < 1) {
    return NextResponse.json({ error: "quantity required" }, { status: 400 });
  }

  const shipment = await prisma.$transaction(async (tx) => {
    const s = await tx.shipment.create({
      data: {
        projectId,
        salesOrderId,
        purchaseOrderId: poId,
        itemId: itemId ?? undefined,
        quantity,
        carrier,
        tracking,
        shippedBy,
        notes,
        receivedAt: receivedAt ? new Date(receivedAt) : null,
      },
      include: { item: true },
    });

    // Update receivedQuantity on the matching PO line
    if (itemId) {
      const poLine = await tx.purchaseOrderLine.findFirst({
        where: { poId, itemId },
      });
      if (poLine) {
        const newReceived = Math.min(
          poLine.receivedQuantity + quantity,
          poLine.quantity,
        );
        await tx.purchaseOrderLine.update({
          where: { id: poLine.id },
          data: { receivedQuantity: newReceived },
        });

        // Auto-update PO status
        const allLines = await tx.purchaseOrderLine.findMany({ where: { poId } });
        const allReceived = allLines.every((l) =>
          l.id === poLine.id
            ? newReceived >= l.quantity
            : l.receivedQuantity >= l.quantity,
        );
        await tx.purchaseOrder.update({
          where: { id: poId },
          data: { status: allReceived ? "RECEIVED" : "PARTIALLY_RECEIVED" },
        });
      }
    }

    return s;
  });

  return NextResponse.json(shipment, { status: 201 });
}

// GET — list shipments for a PO
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; salesOrderId: string; poId: string }> },
) {
  const { poId } = await params;

  const shipments = await prisma.shipment.findMany({
    where: { purchaseOrderId: poId },
    include: { item: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(shipments);
}
