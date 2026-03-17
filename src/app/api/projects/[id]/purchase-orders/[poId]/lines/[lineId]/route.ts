import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ lineId: string }> }
) {
  const { lineId } = await params;
  const { receivedQuantity } = await req.json();
  await prisma.purchaseOrderLine.update({
    where: { id: lineId },
    data: { receivedQuantity },
  });
  return NextResponse.json({ ok: true });
}