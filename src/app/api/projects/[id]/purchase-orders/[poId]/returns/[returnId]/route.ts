import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; poId: string; returnId: string }> }
) {
  const { poId, returnId } = await params;
  const body = await req.json();
  const { status, rmaNumber, notes, reason } = body as {
    status?: string;
    rmaNumber?: string;
    notes?: string;
    reason?: string;
  };

  const updated = await prisma.purchaseOrderReturn.update({
    where: { id: returnId, poId },
    data: {
      ...(status !== undefined && { status: status as "PENDING" | "SENT" | "CREDITED" | "CANCELLED" }),
      ...(rmaNumber !== undefined && { rmaNumber: rmaNumber ?? null }),
      ...(notes !== undefined && { notes: notes ?? null }),
      ...(reason !== undefined && { reason: reason ?? null }),
    },
  });

  // When a return is credited, auto-update PO status if all received items are returned
  if (status === "CREDITED") {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: poId },
      include: {
        lines: {
          include: {
            returnLines: {
              where: { poReturn: { status: "CREDITED" } },
              select: { quantity: true },
            },
          },
        },
      },
    });

    if (po && po.status !== "CANCELLED" && po.status !== "DRAFT") {
      const totalReceived = po.lines.reduce((s, l) => s + l.receivedQuantity, 0);
      const totalCredited = po.lines.reduce(
        (s, l) => s + l.returnLines.reduce((rs, r) => rs + r.quantity, 0),
        0
      );

      let newStatus: "PARTIALLY_RETURNED" | "RETURNED" | null = null;
      if (totalReceived > 0 && totalCredited >= totalReceived) {
        newStatus = "RETURNED";
      } else if (totalCredited > 0) {
        newStatus = "PARTIALLY_RETURNED";
      }

      if (newStatus) {
        await prisma.purchaseOrder.update({
          where: { id: poId },
          data: { status: newStatus },
        });
      }
    }
  }

  // When credited, create inventory movements based on disposition
  if (status === "CREDITED") {
    try {
      const returnWithLines = await prisma.purchaseOrderReturn.findUnique({
        where: { id: returnId },
        include: {
          lines: {
            include: { poLine: { select: { itemId: true } } },
          },
        },
      });
      if (returnWithLines) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const disposition = (returnWithLines as any).disposition ?? "RETURN_TO_VENDOR";
        for (const line of returnWithLines.lines) {
          const itemId = line.poLine.itemId;
          if (!itemId) continue;
          const quantityDelta =
            disposition === "KEEP_IN_INVENTORY"
              ? line.quantity   // positive: stock comes back
              : -line.quantity; // negative: item leaves
          await prisma.inventoryMovement.create({
            data: {
              itemId,
              type: "RETURN",
              quantityDelta,
              notes:
                disposition === "KEEP_IN_INVENTORY"
                  ? `Kept in inventory — not returned to vendor (${returnWithLines.returnNumber ?? returnId})`
                  : `Returned to vendor (${returnWithLines.returnNumber ?? returnId})`,
            },
          });
        }
      }
    } catch {
      // Pre-migration safety — don't fail the status update if inventory write fails
    }
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; poId: string; returnId: string }> }
) {
  const { poId, returnId } = await params;
  // Only PENDING returns can be deleted
  const ret = await prisma.purchaseOrderReturn.findUnique({ where: { id: returnId, poId } });
  if (!ret) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (ret.status !== "PENDING") {
    return NextResponse.json({ error: "Only PENDING returns can be deleted" }, { status: 400 });
  }
  await prisma.purchaseOrderReturn.delete({ where: { id: returnId } });
  return new NextResponse(null, { status: 204 });
}
