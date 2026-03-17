import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { bomIds } = await req.json();

  if (!Array.isArray(bomIds) || bomIds.length === 0) {
    return NextResponse.json(
      { error: "bomIds must be a non-empty array" },
      { status: 400 },
    );
  }

  console.log("Generating quote from BOMs:", bomIds);
  const boms = await prisma.billOfMaterials.findMany({
    where: { id: { in: bomIds }, projectId: id },
    include: {
      lines: { include: { item: true } },
      project: true,
    },
  });

  if (boms.length === 0) {
    return NextResponse.json({ error: "No BOMs found" }, { status: 404 });
  }

  const project = boms[0].project;
  const allLines = boms.flatMap((b) => b.lines);

  console.log("Total lines across selected BOMs:", allLines.length);
  if (allLines.length === 0) {
    return NextResponse.json(
      { error: "Selected BOMs have no lines" },
      { status: 400 },
    );
  }

  // same customer price lookup as before
  const customerPrices = await prisma.customerItemPrice.findMany({
    where: {
      customerId: project.customerId,
      itemId: { in: allLines.map((l) => l.itemId) },
    },
  });
  const priceMap = Object.fromEntries(
    customerPrices.map((cp) => [cp.itemId, cp.price]),
  );

  const lineData = allLines.map((line) => ({
    itemId: line.itemId,
    description: [line.item.manufacturer, line.item.itemNumber]
      .filter(Boolean)
      .join(" — "),
    quantity: line.quantity,
    price: line.sellEach ?? priceMap[line.itemId] ?? line.item.price ?? 0,
    cost: line.costEach ?? line.item.cost ?? null,
  }));

  const total = lineData.reduce((sum, l) => sum + l.price * l.quantity, 0);

  console.log(
    "Creating quote with total:",
    total,
    "and lines:",
    lineData.length,
  );
  const quote = await prisma.quote.create({
    data: {
      customerId: project.customerId,
      projectId: id,
      status: "DRAFT",
      total,
      lines: { create: lineData },
    },
  });

  console.log("linking quotes to BOMs:", bomIds, "with quote ID:", quote.id);
  // associate each BOM with the new quote
  await prisma.quoteBOM.createMany({
    data: bomIds.map((bomId: string) => ({ quoteId: quote.id, bomId })),
  });

  console.log("Quote created with ID:", quote.id);

  return NextResponse.json({ quoteId: quote.id });
}
