import { prisma } from "@/lib/prisma";
import { ItemType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const limit = parseInt(searchParams.get("limit") ?? "200");

  const items = await prisma.item.findMany({
    where: q
      ? {
          OR: [
            { itemNumber: { contains: q, mode: "insensitive" } },
            { manufacturer: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { itemNumber: "asc" },
    take: limit,
    select: {
      id: true,
      itemNumber: true,
      manufacturer: true,
      description: true,
      cost: true,
      price: true,
      type: true,
      active: true,
      preferredVendorId: true,
    },
  });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { itemNumber, manufacturer, description, cost, price, lastSoldPrice, category, type, active, approved, eolDate } = body;

  if (!itemNumber?.trim()) {
    return NextResponse.json({ error: "itemNumber is required" }, { status: 400 });
  }
  if (!type || !Object.values(ItemType).includes(type)) {
    return NextResponse.json({ error: "valid type is required" }, { status: 400 });
  }

  const item = await prisma.item.create({
    data: {
      itemNumber: itemNumber.trim(),
      manufacturer: manufacturer?.trim() || null,
      cost: cost != null ? parseFloat(cost) : null,
      price: price != null ? parseFloat(price) : null,
      lastSoldPrice: lastSoldPrice != null ? parseFloat(lastSoldPrice) : null,
      category: category?.trim() || null,
      type,
      active: active ?? true,
      approved: approved ?? false,
      description: description?.trim() || null,
      eolDate: eolDate ? new Date(eolDate) : null,
    },
  });

  return NextResponse.json(item, { status: 201 });
}