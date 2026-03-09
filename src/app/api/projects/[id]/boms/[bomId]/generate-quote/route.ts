import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; bomId: string }> },
) {
  const { id, bomId } = await params;

  const bom = await prisma.billOfMaterials.findUnique({
    where: { id: bomId },
    include: {
      lines: {
        include: { item: true },
      },
      project: true,
    },
  });

  if (!bom || bom.projectId !== id) {
    return NextResponse.json({ error: "BOM not found" }, { status: 404 });
  }

  if (bom.lines.length === 0) {
    return NextResponse.json({ error: "BOM has no lines" }, { status: 400 });
  }

  const customerPrices = await prisma.customerItemPrice.findMany({
    where: {
      customerId: bom.project.customerId,
      itemId: { in: bom.lines.map((l) => l.itemId) },
    },
  });

  const priceMap = Object.fromEntries(
    customerPrices.map((cp) => [cp.itemId, cp.price]),
  );

  const lineData = bom.lines.map((line) => ({
    itemId: line.itemId,
    description: [line.item.manufacturer, line.item.itemNumber]
      .filter(Boolean)
      .join(" — "),
    quantity: line.quantity,
    price: priceMap[line.itemId] ?? line.item.price ?? 0,
    cost: line.item.cost ?? null,
  }));

  const total = lineData.reduce((sum, l) => sum + l.price * l.quantity, 0);

  const quote = await prisma.quote.create({
    data: {
      customerId: bom.project.customerId,
      projectId: bom.projectId,
      billOfMaterialsId: bom.id,
      status: "DRAFT",
      total,
      lines: { create: lineData },
    },
  });

  return NextResponse.json({ quoteId: quote.id });
}
