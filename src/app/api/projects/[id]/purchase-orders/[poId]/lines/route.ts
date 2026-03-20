import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; poId: string }> }
) {
  const { poId } = await params;
  const { itemId, quantity, cost } = await req.json();

  if (!quantity || quantity < 1) {
    return NextResponse.json({ error: "quantity must be >= 1" }, { status: 400 });
  }

  // Look up vendor price to determine costOverridden
  const po = await prisma.purchaseOrder.findUnique({
    where: { id: poId },
    select: { vendorId: true },
  });

  let costOverridden = false;
  if (po?.vendorId && itemId) {
    const vp = await prisma.vendorItemPrice.findUnique({
      where: { vendorId_itemId: { vendorId: po.vendorId, itemId } },
      select: { cost: true },
    });
    if (vp && cost !== vp.cost) costOverridden = true;
  }

  const line = await prisma.purchaseOrderLine.create({
    data: {
      poId,
      itemId: itemId ?? null,
      quantity,
      cost: parseFloat(cost),
      costOverridden,
      receivedQuantity: 0,
    },
    include: { item: true },
  });

  return NextResponse.json(line, { status: 201 });
}
