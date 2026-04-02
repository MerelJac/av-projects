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

  // Build list of received items before the transaction
  const receivedItems: { itemId: string; quantity: number }[] = [];
  if (markingReceived) {
    const itemLines = existing.lines.filter((l) => l.itemId && l.quantity > 0);
    receivedItems.push(...itemLines.map((l) => ({ itemId: l.itemId!, quantity: l.quantity })));
    if (existing.lines.length === 0 && existing.itemId && existing.quantity > 0) {
      receivedItems.push({ itemId: existing.itemId, quantity: existing.quantity });
    }
  }

  // Main transaction: mark received + create RECEIPT movements.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (prisma as any).$transaction(async (tx: any) => {
    await tx.shipment.update({
      where: { id: shipmentId },
      data: { receivedAt: receivedAt ? new Date(receivedAt) : null },
    });

    if (receivedItems.length > 0) {
      await tx.inventoryMovement.createMany({
        data: receivedItems.map((r) => ({
          itemId: r.itemId,
          type: "RECEIPT",
          quantityDelta: r.quantity,
          shipmentId: existing.id,
          notes: "Received via shipment",
        })),
      });
    }
  });

  // BOM allocation: separate transaction so a pre-migration failure never
  // rolls back the shipment receipt above.
  if (receivedItems.length > 0) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (prisma as any).$transaction(async (tx: any) => {
        for (const { itemId, quantity: receivedQty } of receivedItems) {
          const bomLines = await tx.bOMLine.findMany({
            where: { itemId, bom: { projectId } },
            select: { id: true, quantity: true },
          });

          let remaining = receivedQty;
          for (const bomLine of bomLines) {
            if (remaining <= 0) break;

            const agg = await tx.inventoryMovement.aggregate({
              where: { bomLineId: bomLine.id, type: "BOM_ALLOCATION" },
              _sum: { quantityDelta: true },
            });
            const alreadyAllocated = Math.abs(agg._sum?.quantityDelta ?? 0);
            const stillNeeded = Math.max(0, bomLine.quantity - alreadyAllocated);

            if (stillNeeded <= 0) continue;

            const toAllocate = Math.min(remaining, stillNeeded);
            await tx.inventoryMovement.create({
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
          }
        }
      });
    } catch {
      // Migration not yet applied — allocation skipped, receipt already committed.
      console.warn("BOM allocation skipped (run prisma migrate to enable)");
    }
  }

  return NextResponse.json({ ok: true });
}
