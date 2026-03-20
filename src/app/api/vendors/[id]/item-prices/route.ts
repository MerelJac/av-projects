import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const prices = await prisma.vendorItemPrice.findMany({
    where: { vendorId: id },
    include: {
      item: { select: { id: true, itemNumber: true, manufacturer: true, description: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(prices);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { itemId, cost, leadTimeDays, notes } = await req.json();

  if (!itemId || cost == null) {
    return NextResponse.json({ error: "itemId and cost are required" }, { status: 400 });
  }

  const price = await prisma.vendorItemPrice.upsert({
    where: { vendorId_itemId: { vendorId: id, itemId } },
    create: {
      vendorId: id,
      itemId,
      cost: parseFloat(cost),
      leadTimeDays: leadTimeDays ?? null,
      notes: notes?.trim() || null,
    },
    update: {
      cost: parseFloat(cost),
      leadTimeDays: leadTimeDays ?? null,
      notes: notes?.trim() || null,
    },
    include: {
      item: { select: { id: true, itemNumber: true, manufacturer: true, description: true } },
    },
  });

  return NextResponse.json(price);
}
