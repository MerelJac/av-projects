import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ priceId: string }> }
) {
  const { priceId } = await params;
  const { cost, leadTimeDays, notes } = await req.json();

  const price = await prisma.vendorItemPrice.update({
    where: { id: priceId },
    data: {
      ...(cost !== undefined && { cost: parseFloat(cost) }),
      ...(leadTimeDays !== undefined && { leadTimeDays: leadTimeDays ?? null }),
      ...(notes !== undefined && { notes: notes?.trim() || null }),
    },
    include: {
      item: { select: { id: true, itemNumber: true, manufacturer: true, description: true } },
    },
  });

  return NextResponse.json(price);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ priceId: string }> }
) {
  const { priceId } = await params;
  await prisma.vendorItemPrice.delete({ where: { id: priceId } });
  return new NextResponse(null, { status: 204 });
}
