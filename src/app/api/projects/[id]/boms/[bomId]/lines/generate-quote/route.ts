import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; bomId: string } }
) {
  const bom = await prisma.billOfMaterials.findUnique({
    where: { id: params.bomId },
    include: {
      lines: {
        include: { item: true },
        orderBy: { sortOrder: "asc" },
      },
      project: true,
    },
  });

  if (!bom || bom.projectId !== params.id) {
    return NextResponse.json({ error: "BOM not found" }, { status: 404 });
  }

  if (bom.lines.length === 0) {
    return NextResponse.json({ error: "BOM has no lines" }, { status: 400 });
  }

  // Snapshot: prices are captured at quote generation time
  const lineData = bom.lines.map((line) => ({
    itemId: line.itemId,
    description: [line.item.manufacturer, line.item.itemNumber]
      .filter(Boolean)
      .join(" — "),
    quantity: line.quantity,
    price: line.item.price ?? 0,   // snapshot current price
    cost: line.item.cost ?? null,  // snapshot current cost
  }));

  const total = lineData.reduce((sum, l) => sum + l.price * l.quantity, 0);

  const quote = await prisma.quote.create({
    data: {
      customerId: bom.project.customerId,
      projectId: bom.projectId,
      bomId: bom.id,
      status: "DRAFT",
      total,
      lines: { create: lineData },
    },
  });

  return NextResponse.json({ quoteId: quote.id });
}
