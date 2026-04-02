import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ shipmentId: string }> }
) {
  const { shipmentId } = await params;
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

    // Create an inventory movement for each line that has an item.
    // Using (tx as any) until migration runs and Prisma client is regenerated.
    if (markingReceived) {
      const itemLines = existing.lines.filter((l) => l.itemId && l.quantity > 0);
      if (itemLines.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (tx as any).inventoryMovement.createMany({
          data: itemLines.map((l) => ({
            itemId: l.itemId!,
            type: "RECEIPT",
            quantityDelta: l.quantity,
            shipmentId: existing.id,
            notes: `Received via shipment`,
          })),
        });
      }

      // Also handle legacy shipments with a top-level itemId and no lines
      if (existing.lines.length === 0 && existing.itemId && existing.quantity > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (tx as any).inventoryMovement.create({
          data: {
            itemId: existing.itemId,
            type: "RECEIPT",
            quantityDelta: existing.quantity,
            shipmentId: existing.id,
            notes: `Received via shipment`,
          },
        });
      }
    }
  });

  return NextResponse.json({ ok: true });
}