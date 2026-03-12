import { prisma } from "@/lib/prisma";
import { ItemType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const item = await prisma.item.findUnique({
    where: { id },
    include: {
      priceHistory: {
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(item);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();
  const {
    itemNumber, manufacturer, description, cost, price, lastSoldPrice,
    category, type, active, approved, eolDate,
    changedBy,
  } = body;

  if (type && !Object.values(ItemType).includes(type)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  // Fetch current values to detect price/cost changes
  const existing = await prisma.item.findUnique({
    where: { id },
    select: { cost: true, price: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const newCost  = cost  !== undefined ? (cost  != null ? parseFloat(cost)  : null) : existing.cost;
  const newPrice = price !== undefined ? (price != null ? parseFloat(price) : null) : existing.price;

  const costChanged  = cost  !== undefined && newCost  !== existing.cost;
  const priceChanged = price !== undefined && newPrice !== existing.price;
  const needsHistory = costChanged || priceChanged;

  const updateData = {
    ...(itemNumber    !== undefined && { itemNumber: itemNumber.trim() }),
    ...(manufacturer  !== undefined && { manufacturer: manufacturer?.trim() || null }),
    ...(cost          !== undefined && { cost: newCost }),
    ...(price         !== undefined && { price: newPrice }),
    ...(lastSoldPrice !== undefined && { lastSoldPrice: lastSoldPrice != null ? parseFloat(lastSoldPrice) : null }),
    ...(category      !== undefined && { category: category?.trim() || null }),
    ...(type          !== undefined && { type }),
    ...(active        !== undefined && { active }),
    ...(approved      !== undefined && { approved }),
    ...(description   !== undefined && { description: description?.trim() || null }),
    ...(eolDate       !== undefined && { eolDate: eolDate ? new Date(eolDate) : null }),
  };

  const [item] = await prisma.$transaction([
    prisma.item.update({ where: { id }, data: updateData }),
    ...(needsHistory
      ? [
          prisma.itemPriceHistory.create({
            data: {
              itemId: id,
              cost:  costChanged  ? newCost  : existing.cost,
              price: priceChanged ? newPrice : existing.price,
              changedBy: changedBy ?? null,
            },
          }),
        ]
      : []),
  ]);

  return NextResponse.json(item);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await prisma.item.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}