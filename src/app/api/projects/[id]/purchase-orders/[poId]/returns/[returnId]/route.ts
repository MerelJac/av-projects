import { prisma } from "@/lib/prisma";
import { calculateVertexTax } from "@/lib/utils/vertex";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  {
    params,
  }: { params: Promise<{ id: string; poId: string; returnId: string }> },
) {
  const { poId, returnId } = await params;
  const body = await req.json();
  const {
    status,
    rmaNumber,
    notes,
    reason,
    creditQuantity,
    creditUnitCost,
    creditUnitPrice,
  } = body as {
    status?: string;
    rmaNumber?: string;
    notes?: string;
    reason?: string;
    creditQuantity?: number;
    creditUnitCost?: number;
    creditUnitPrice?: number;
  };

  const updated = await prisma.purchaseOrderReturn.update({
    where: { id: returnId, poId },
    data: {
      ...(status !== undefined && {
        status: status as "PENDING" | "SENT" | "CREDITED" | "CANCELLED",
      }),
      ...(rmaNumber !== undefined && { rmaNumber: rmaNumber ?? null }),
      ...(notes !== undefined && { notes: notes ?? null }),
      ...(reason !== undefined && { reason: reason ?? null }),
    },
  });

  let projectId: string | null = null;

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

    projectId = po?.projectId ?? null;
    if (!projectId) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (po && po.status !== "CANCELLED" && po.status !== "DRAFT") {
      const totalReceived = po.lines.reduce(
        (s, l) => s + l.receivedQuantity,
        0,
      );
      const totalCredited = po.lines.reduce(
        (s, l) => s + l.returnLines.reduce((rs, r) => rs + r.quantity, 0),
        0,
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
            include: {
              poLine: {
                select: {
                  itemId: true,
                  purchaseOrder: { select: { projectId: true } },
                },
              },
            },
          },
        },
      });
      if (returnWithLines) {
        const disposition =
          (returnWithLines.disposition as string) ?? "RETURN_TO_VENDOR";
        for (const line of returnWithLines.lines) {
          const itemId = line.poLine.itemId;
          if (!itemId) continue;
          const quantityDelta =
            disposition === "KEEP_IN_INVENTORY"
              ? line.quantity // positive: stock comes back
              : -line.quantity; // negative: item leaves
          const type =
            disposition === "KEEP_IN_INVENTORY"
              ? "RETURN_TO_INVENTORY"
              : "RETURN_TO_VENDOR";
          await prisma.inventoryMovement.create({
            data: {
              itemId,
              type, // either RETURN_TO_INVENTORY or RETURN_TO_VENDOR based on disposition
              quantityDelta,
              returnId: returnId,
              notes:
                disposition === "KEEP_IN_INVENTORY"
                  ? `Kept in inventory — not returned to vendor (${returnWithLines.returnNumber ?? returnId})`
                  : `Returned to vendor (${returnWithLines.returnNumber ?? returnId})`,
            },
          });

          // refund the projectCost
          const qty = creditQuantity ?? line.quantity;
          const uc = creditUnitCost ?? line.creditPerUnit ?? 0;
          const up = creditUnitPrice ?? line.creditPerUnit ?? 0;
          await prisma.projectCost.create({
            data: {
              poLink: returnWithLines.poId ?? returnId,
              itemId,
              costType: "RETURN",
              projectId: projectId as string,
              quantity: qty,
              unitCost: uc,
              amount: -(qty * uc),
              unitPrice: up,
              amountPrice: -(qty * up),
              poReturnId: returnId,
              notes:
                disposition === "KEEP_IN_INVENTORY"
                  ? `Return kept in inventory (${returnWithLines.returnNumber ?? returnId})`
                  : `Returned to vendor (${returnWithLines.returnNumber ?? returnId})`,
            },
          });
        }

        // ── Tax credits on return costs ───────────────────────────────────
        const returnCosts = await prisma.projectCost.findMany({
          where: { poReturnId: returnId, costType: "RETURN" },
          include: {
            item: { select: { itemNumber: true, taxStatus: true } },
          },
        });

        const taxableCosts = returnCosts.filter(
          (c) => c.item?.taxStatus === "TAXABLE" && (c.unitCost ?? 0),
        );

        if (taxableCosts.length > 0) {
          const po = await prisma.purchaseOrder.findUnique({
            where: { id: poId },
            select: { shipToAddress: true },
          });

          if (po?.shipToAddress) {
            const result = await calculateVertexTax({
              documentNumber: `RET-${returnId.slice(0, 8).toUpperCase()}`,
              destination: po.shipToAddress,
              lines: taxableCosts.map((c, i) => ({
                lineItemNumber: (i + 1) * 10000,
                productCode: c.item?.itemNumber ?? c.itemId ?? "UNKNOWN",
                quantity: c.quantity ?? 1,
                unitPrice: c.unitCost ?? 0,
              })),
            });

            if (result) {
              await Promise.all(
                taxableCosts.map((c, i) =>
                  prisma.projectCost.update({
                    where: { id: c.id },
                    // Return tax is a credit — store as negative
                    data: { taxAmount: -(result.lineTaxes[i]?.taxAmount ?? 0) },
                  }),
                ),
              );
            }
          }
        }

        const taxablePrice = returnCosts.filter(
          (c) => c.item?.taxStatus === "TAXABLE" && (c.unitPrice ?? 0),
        );

        if (taxablePrice.length > 0) {
          const po = await prisma.purchaseOrder.findUnique({
            where: { id: poId },
            select: { shipToAddress: true },
          });

          if (po?.shipToAddress) {
            const result = await calculateVertexTax({
              documentNumber: `RET-${returnId.slice(0, 8).toUpperCase()}`,
              destination: po.shipToAddress,
              lines: taxablePrice.map((c, i) => ({
                lineItemNumber: (i + 1) * 10000,
                productCode: c.item?.itemNumber ?? c.itemId ?? "UNKNOWN",
                quantity: c.quantity ?? 1,
                unitPrice: c.unitCost ?? 0,
              })),
            });

            if (result) {
              await Promise.all(
                taxablePrice.map((c, i) =>
                  prisma.projectCost.update({
                    where: { id: c.id },
                    // Return tax is a credit — store as negative
                    data: {
                      taxAmountPrice: -(result.lineTaxes[i]?.taxAmount ?? 0),
                    },
                  }),
                ),
              );
            }
          }
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
  {
    params,
  }: { params: Promise<{ id: string; poId: string; returnId: string }> },
) {
  const { poId, returnId } = await params;
  // Only PENDING returns can be deleted
  const ret = await prisma.purchaseOrderReturn.findUnique({
    where: { id: returnId, poId },
  });
  if (!ret) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (ret.status !== "PENDING") {
    return NextResponse.json(
      { error: "Only PENDING returns can be deleted" },
      { status: 400 },
    );
  }
  await prisma.purchaseOrderReturn.delete({ where: { id: returnId } });
  return new NextResponse(null, { status: 204 });
}
