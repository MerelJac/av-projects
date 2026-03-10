import { prisma } from "@/lib/prisma";
import { ItemType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> },
) {
  const { itemId } = await params;
  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(item);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> },
) {
  const { itemId } = await params;
  const body = await req.json();
  const { itemNumber, manufacturer, cost, price, lastSoldPrice, category, type, active, approved, eolDate } = body;

  if (type && !Object.values(ItemType).includes(type)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const item = await prisma.item.update({
    where: { id: itemId },
    data: {
      ...(itemNumber !== undefined && { itemNumber: itemNumber.trim() }),
      ...(manufacturer !== undefined && { manufacturer: manufacturer?.trim() || null }),
      ...(cost !== undefined && { cost: cost != null ? parseFloat(cost) : null }),
      ...(price !== undefined && { price: price != null ? parseFloat(price) : null }),
      ...(lastSoldPrice !== undefined && { lastSoldPrice: lastSoldPrice != null ? parseFloat(lastSoldPrice) : null }),
      ...(category !== undefined && { category: category?.trim() || null }),
      ...(type !== undefined && { type }),
      ...(active !== undefined && { active }),
      ...(approved !== undefined && { approved }),
      ...(eolDate !== undefined && { eolDate: eolDate ? new Date(eolDate) : null }),
    },
  });

  return NextResponse.json(item);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> },
) {
  const { itemId } = await params;
  await prisma.item.delete({ where: { id: itemId } });
  return new NextResponse(null, { status: 204 });
}