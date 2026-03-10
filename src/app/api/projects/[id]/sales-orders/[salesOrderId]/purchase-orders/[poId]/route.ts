import { prisma } from "@/lib/prisma";
import { POStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; salesOrderId: string; poId: string }> },
) {
  const { poId } = await params;

  const po = await prisma.purchaseOrder.findUnique({
    where: { id: poId },
    include: {
      lines: { include: { item: true, salesOrderLine: true } },
      shipments: { include: { item: true } },
    },
  });

  if (!po) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(po);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; salesOrderId: string; poId: string }> },
) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET! });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { poId } = await params;
  const { status, notes, lines } = await req.json();

  const po = await prisma.$transaction(async (tx) => {
    // Update individual line receivedQuantities if provided
    if (lines?.length) {
      for (const l of lines) {
        await tx.purchaseOrderLine.update({
          where: { id: l.id },
          data: { receivedQuantity: l.receivedQuantity },
        });
      }
    }

    // Auto-derive status from received quantities if not explicitly provided
    let resolvedStatus: POStatus | undefined = status;
    if (!resolvedStatus) {
      const updatedLines = await tx.purchaseOrderLine.findMany({ where: { poId } });
      const allReceived = updatedLines.every((l) => l.receivedQuantity >= l.quantity);
      const anyReceived = updatedLines.some((l) => l.receivedQuantity > 0);
      if (allReceived) resolvedStatus = "RECEIVED";
      else if (anyReceived) resolvedStatus = "PARTIALLY_RECEIVED";
    }

    return tx.purchaseOrder.update({
      where: { id: poId },
      data: {
        ...(resolvedStatus && { status: resolvedStatus }),
        ...(notes !== undefined && { notes }),
      },
      include: {
        lines: { include: { item: true, salesOrderLine: true } },
        shipments: { include: { item: true } },
      },
    });
  });

  return NextResponse.json(po);
}