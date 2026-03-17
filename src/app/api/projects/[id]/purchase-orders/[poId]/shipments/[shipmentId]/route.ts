import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ shipmentId: string }> }
) {
  const { shipmentId } = await params;
  const { receivedAt } = await req.json();

  await prisma.shipment.update({
    where: { id: shipmentId },
    data: { receivedAt: receivedAt ? new Date(receivedAt) : null },
  });

  return NextResponse.json({ ok: true });
}