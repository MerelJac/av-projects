import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

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
        receivedQuantity: quantity, // mirrors quantity by default
      },
      include: { item: true },
    });

    // Increment receivedQuantity on the matching PO line
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

        // Auto-update PO status based on all lines
        const allLines = await tx.purchaseOrderLine.findMany({ where: { poId } });
        const allDone = allLines.every((l) =>
          l.id === poLine.id
            ? newReceived >= l.quantity
            : l.receivedQuantity >= l.quantity,
        );

        await tx.purchaseOrder.update({
          where: { id: poId },
          data: { status: allDone ? "RECEIVED" : "PARTIALLY_RECEIVED" },
        });
      }
    }

    return s;
  });

  return NextResponse.json(shipment, { status: 201 });
}