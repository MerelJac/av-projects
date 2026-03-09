import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { prices } = await req.json();

  await Promise.all(
    prices.map(({ itemId, price }: { itemId: string; price: number }) =>
      prisma.customerItemPrice.upsert({
        where: { customerId_itemId: { customerId: id, itemId } },
        update: { price },
        create: { customerId: id, itemId, price },
      })
    )
  );

  return NextResponse.json({ ok: true });
}
