import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ lineId: string }> }
) {
  const { lineId } = await params;
  const { receivedQuantity, quantity, cost } = await req.json();

  await prisma.purchaseOrderLine.update({
    where: { id: lineId },
    data: {
      ...(receivedQuantity !== undefined && { receivedQuantity }),
      ...(quantity !== undefined && { quantity }),
      ...(cost !== undefined && { cost: parseFloat(cost), costOverridden: true }),
    },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ lineId: string }> }
) {
  const { lineId } = await params;
  await prisma.purchaseOrderLine.delete({ where: { id: lineId } });
  return new NextResponse(null, { status: 204 });
}
