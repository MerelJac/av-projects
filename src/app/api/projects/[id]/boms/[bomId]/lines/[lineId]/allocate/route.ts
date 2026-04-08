import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; bomId: string; lineId: string }> }
) {
  const { id: projectId, bomId, lineId } = await params;

  // Verify line belongs to this BOM and project
  const line = await prisma.bOMLine.findUnique({
    where: { id: lineId },
    include: { bom: { select: { projectId: true } } },
  });

  if (!line || line.bom.projectId !== projectId || line.bomId !== bomId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!line.itemId) {
    return NextResponse.json({ error: "Line has no item" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prismaAny = prisma as any;

  // Current on-hand for this item (sum of all movements)
  const allMovements: { quantityDelta: number }[] =
    await prismaAny.inventoryMovement.findMany({
      where: { itemId: line.itemId },
      select: { quantityDelta: true },
    });
  const onHand = allMovements.reduce((s, m) => s + m.quantityDelta, 0);

  // Already allocated to this line
  const existingAllocations: { quantityDelta: number }[] =
    await prismaAny.inventoryMovement.findMany({
      where: { type: "BOM_ALLOCATION", bomLineId: lineId },
      select: { quantityDelta: true },
    });
  const alreadyAllocated = existingAllocations.reduce(
    (s, m) => s + Math.abs(m.quantityDelta),
    0,
  );

  const needed = line.quantity - alreadyAllocated;
  const toAllocate = Math.min(needed, onHand);

  if (toAllocate <= 0) {
    return NextResponse.json(
      { error: onHand <= 0 ? "No stock available" : "Line already fully allocated" },
      { status: 400 },
    );
  }

  const movement = await prismaAny.inventoryMovement.create({
    data: {
      itemId: line.itemId,
      type: "BOM_ALLOCATION",
      quantityDelta: -toAllocate,
      bomLineId: lineId,
      notes: "Manually allocated from inventory",
    },
  });

  return NextResponse.json({ movement, allocated: toAllocate, onHand });
}
