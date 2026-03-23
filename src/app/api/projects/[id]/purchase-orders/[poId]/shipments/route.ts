import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; poId: string }> }
) {
  const { id, poId } = await params;
  const { tracking, carrier, quantity, lineIds, cost } = await req.json();

  const po = await prisma.purchaseOrder.findUnique({
    where: { id: poId },
    include: { lines: { include: { item: true } } },
  });
  if (!po) return NextResponse.json({ error: "PO not found" }, { status: 404 });

  const selectedLines = po.lines.filter((l) => lineIds.includes(l.id));

  const shipment = await prisma.shipment.create({
    data: {
      projectId: id,
      purchaseOrderId: poId,
      tracking,
      carrier: carrier ?? null,
      quantity,
      cost: cost != null ? cost : null,
      receivedQuantity: 0,
      lines: {
        create: selectedLines.map((l) => ({
          itemId: l.itemId,
          poLineId: l.id,
          quantity: l.quantity,
        })),
      },
    },
    include: { lines: { include: { item: true } } },
  });

  return NextResponse.json({ shipment });
}

