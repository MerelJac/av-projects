import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; shipmentId: string }> }
) {
  const { id: projectId, shipmentId } = await params;
  const { receivedAt } = await req.json();

  const existing = await prisma.shipment.findUnique({
    where: { id: shipmentId },
    include: { lines: true },
  });

  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const markingReceived = receivedAt && !existing.receivedAt;

  await prisma.$transaction(async (tx) => {
    await tx.shipment.update({
      where: { id: shipmentId },
      data: { receivedAt: receivedAt ? new Date(receivedAt) : null },
    });

    // Create RECEIPT movements and auto-allocate to BOM lines.
    // Using (tx as any) until migration runs and Prisma client is regenerated.
    if (markingReceived) {
      const itemLines = existing.lines.filter((l) => l.itemId && l.quantity > 0);

      // Build the full list of received items (lines + legacy top-level)
      const receivedItems: { itemId: string; quantity: number }[] = itemLines.map(
        (l) => ({ itemId: l.itemId!, quantity: l.quantity }),
      );
      if (existing.lines.length === 0 && existing.itemId && existing.quantity > 0) {
        receivedItems.push({ itemId: existing.itemId, quantity: existing.quantity });
      }

      if (receivedItems.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (tx as any).inventoryMovement.createMany({
          data: receivedItems.map((r) => ({
            itemId: r.itemId,
            type: "RECEIPT",
            quantityDelta: r.quantity,
            shipmentId: existing.id,
            notes: "Received via shipment",
          })),
        });
      }

      // Auto-allocate to BOM lines for this project.
      // For each received item, find BOM lines in the project needing that item,
      // and decrement inventory up to what the BOM needs (surplus stays free).
      for (const { itemId, quantity: receivedQty } of receivedItems) {
        const bomLines = await tx.bOMLine.findMany({
          where: { itemId, bom: { projectId } },
          select: { id: true, quantity: true },
        });

        let remaining = receivedQty;
        for (const bomLine of bomLines) {
          if (remaining <= 0) break;

          // How much has already been allocated to this BOM line?
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const agg = await (tx as any).inventoryMovement.aggregate({
            where: { bomLineId: bomLine.id, type: "BOM_ALLOCATION" },
            _sum: { quantityDelta: true },
          });
          const alreadyAllocated = Math.abs(agg._sum?.quantityDelta ?? 0);
          const stillNeeded = Math.max(0, bomLine.quantity - alreadyAllocated);

          if (stillNeeded <= 0) continue;

          const toAllocate = Math.min(remaining, stillNeeded);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (tx as any).inventoryMovement.create({
            data: {
              itemId,
              type: "BOM_ALLOCATION",
              quantityDelta: -toAllocate,
              shipmentId: existing.id,
              bomLineId: bomLine.id,
              notes: "Auto-allocated to BOM on receipt",
            },
          });
          remaining -= toAllocate;
          // remaining > 0 after all BOM lines = surplus, stays as free inventory
        }
      }
    }
  });

  return NextResponse.json({ ok: true });
}