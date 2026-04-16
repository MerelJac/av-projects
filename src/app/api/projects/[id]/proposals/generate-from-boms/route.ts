import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { bomIds, type } = await req.json();

  if (!Array.isArray(bomIds) || bomIds.length === 0) {
    return NextResponse.json(
      { error: "bomIds must be a non-empty array" },
      { status: 400 },
    );
  }

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

  const allLines = boms.flatMap((b) => b.lines);
  if (allLines.length === 0) {
    return NextResponse.json(
      { error: "Selected BOMs have no lines" },
      { status: 400 },
    );
  }

  const project = boms[0].project;

  const customerPrices = await prisma.customerItemPrice.findMany({
    where: {
      customerId: project.customerId,
      itemId: { in: allLines.map((l) => l.itemId) },
    },
  });
  const priceMap = Object.fromEntries(
    customerPrices.map((cp) => [cp.itemId, cp.price]),
  );

  // Group lines by section name — same section across different BOMs merges into one bundle
  const sectionMap = new Map<string, typeof allLines>();
  for (const line of allLines) {
    const section = line.section?.trim() || "General";
    if (!sectionMap.has(section)) sectionMap.set(section, []);
    sectionMap.get(section)!.push(line);
  }

  const total = allLines.reduce((sum, l) => {
    const price = l.sellEach ?? priceMap[l.itemId] ?? l.item.price ?? 0;
    return sum + price * l.quantity;
  }, 0);

  const quote = await prisma.quote.create({
    data: {
      id: `AV-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`,
      customerId: project.customerId,
      projectId: id,
      status: "DRAFT",
      total,
      isChangeOrder: type === "CHANGE_ORDER",
      isDirect: type === "DIRECT",
    },
  });

  // One QuoteBundle per unique section name
  for (const [section, lines] of sectionMap) {
    await prisma.quoteBundle.create({
      data: {
        quoteId: quote.id,
        name: section,
        lines: {
          create: lines.map((line) => ({
            quoteId: quote.id,
            itemId: line.itemId,
            description: [line.item.manufacturer, line.item.itemNumber]
              .filter(Boolean)
              .join(" — "),
            quantity: line.quantity,
            price:
              line.sellEach ?? priceMap[line.itemId] ?? line.item.price ?? 0,
            cost: line.costEach ?? line.item.cost ?? null,
          })),
        },
      },
    });
  }

  // Link each BOM to the quote in the join table
  await prisma.quoteBOM.createMany({
    data: bomIds.map((bomId: string) => ({ quoteId: quote.id, bomId })),
  });

  return NextResponse.json({ quoteId: quote.id });
}
