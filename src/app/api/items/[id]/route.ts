import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const existing = await prisma.item.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const priceChanged = body.price !== existing.price;
  const costChanged = body.cost !== existing.cost;

  const item = await prisma.item.update({
    where: { id },
    data: {
      itemNumber: body.itemNumber,
      manufacturer: body.manufacturer,
      cost: body.cost,
      price: body.price,
      lastSoldPrice: body.lastSoldPrice,
      category: body.category,
      type: body.type,
      active: body.active,
      approved: body.approved,
      eolDate: body.eolDate ? new Date(body.eolDate) : null,
    },
  });

  if (priceChanged || costChanged) {
    await prisma.itemPriceHistory.create({
      data: {
        itemId: id,
        cost: costChanged ? body.cost : undefined,
        price: priceChanged ? body.price : undefined,
      },
    });
  }

  return NextResponse.json(item);
}