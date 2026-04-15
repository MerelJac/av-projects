import { prisma } from "@/lib/prisma";
import { calculateVertexTax } from "@/lib/utils/vertex";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; shipmentId: string }> },
) {
  const { id: projectId, shipmentId } = await params;
  const { receivedAt } = await req.json();

  // ─────────────────────────────────────────────
  // 1. Load shipment with full lineage
  // ─────────────────────────────────────────────
  const shipment = await prisma.shipment.findUnique({
    where: { id: shipmentId },
    select: {
      id: true,
      receivedAt: true,
      cost: true,
      lines: {
        include: {
          poLine: true, // includes cost + poId
        },
      },
    },
  });

  if (!shipment) {
    return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
  }

  const isMarkingReceived = receivedAt && !shipment.receivedAt;

  // ─────────────────────────────────────────────
  // 2. TRANSACTION: mark received + create RECEIPTS
  // ─────────────────────────────────────────────
  await prisma.$transaction(async (tx) => {
    // mark received
    await tx.shipment.update({
      where: { id: shipmentId },
      data: {
        receivedAt: receivedAt ? new Date(receivedAt) : null,
      },
    });

    if (!isMarkingReceived) return;

    // create RECEIPT movements (line-level)
    for (const line of shipment.lines) {
      if (!line.itemId || line.quantity <= 0) continue;

      await tx.inventoryMovement.create({
        data: {
          itemId: line.itemId,
          type: "RECEIPT",
          quantityDelta: line.quantity,
          shipmentId: shipment.id,
          notes: "Received via shipment",
        },
      });
    }
  });

  // ─────────────────────────────────────────────
  // 3. BOM ALLOCATION (separate transaction)
  // ─────────────────────────────────────────────
  if (!isMarkingReceived) {
    return NextResponse.json({ ok: true });
  }

  try {
    await prisma.$transaction(async (tx) => {
      for (const line of shipment.lines) {
        if (!line.itemId || line.quantity <= 0) continue;

        const itemId = line.itemId;
        let remainingQty = line.quantity;

        const poLine = line.poLine;
        const unitCost = poLine?.cost ?? Number(shipment.cost ?? 0);

        const poId = poLine?.poId ?? null;

        // ─────────────────────────────
        // Find BOM demand for this item
        // ─────────────────────────────
        const bomLines = await tx.bOMLine.findMany({
          where: {
            itemId,
            bom: { projectId },
          },
          select: {
            id: true,
            quantity: true,
            bomId: true,
            sellEach: true,
          },
          orderBy: {
            id: "asc", // deterministic allocation order
          },
        });

        for (const bomLine of bomLines) {
          if (remainingQty <= 0) break;

          // ─────────────────────────────
          // Calculate already allocated
          // ─────────────────────────────
          const allocationAgg = await tx.inventoryMovement.aggregate({
            where: {
              bomLineId: bomLine.id,
              type: "BOM_ALLOCATION",
            },
            _sum: {
              quantityDelta: true,
            },
          });

          const alreadyAllocated = Math.abs(
            allocationAgg._sum.quantityDelta ?? 0,
          );

          const stillNeeded = Math.max(0, bomLine.quantity - alreadyAllocated);

          if (stillNeeded <= 0) continue;

          // ─────────────────────────────
          // Allocate
          // ─────────────────────────────
          const allocateQty = Math.min(remainingQty, stillNeeded);
          const unitSellAtPrice = bomLine.sellEach ?? null;
          const amountPrice = unitSellAtPrice
            ? unitSellAtPrice * allocateQty
            : null;
          // 1. Inventory movement (consumption)
          await tx.inventoryMovement.create({
            data: {
              itemId,
              type: "BOM_ALLOCATION",
              quantityDelta: -allocateQty,
              shipmentId: shipment.id,
              bomLineId: bomLine.id,
              notes: "Auto-allocated from shipment receipt",
            },
          });

          // 2. Financial record (project cost) — taxAmount populated after transaction
          await tx.projectCost.create({
            data: {
              projectId,
              itemId,
              quantity: allocateQty,
              unitCost,
              amount: unitCost * allocateQty,
              unitPrice: unitSellAtPrice,
              amountPrice: amountPrice,
              costType: "MATERIAL",
              shipmentId: shipment.id,
              poLink: poId,
              bomId: bomLine.bomId,
              bomLineId: bomLine.id,
              notes: "Auto-allocated from shipment receipt",
            },
          });

          remainingQty -= allocateQty;
        }
      }
    });
  } catch (err) {
    console.error("BOM allocation failed", err);
    // do NOT throw — receipt already succeeded
  }

  // ─────────────────────────────────────────────
  // 4. FREIGHT cost + tax
  // ─────────────────────────────────────────────
  const shippingCost = Number(shipment.cost ?? 0);
  if (shippingCost > 0) {
    try {
      // Resolve PO for ship-to address (use first line's poId)
      const freightPoId =
        shipment.lines.find((l) => l.poLine?.poId)?.poLine?.poId ?? null;

      // SHIPPING is not taxable
      const freightTax: number = 0;

      await prisma.projectCost.create({
        data: {
          projectId,
          costType: "FREIGHT",
          quantity: 1,
          amount: shippingCost,
          unitCost: shippingCost,
          taxAmount: freightTax,
          // Cost and Sell Price are the same
          amountPrice: shippingCost,
          unitPrice: shippingCost,
          taxAmountPrice: freightTax,
          shipmentId: shipment.id,
          poLink: freightPoId,
          notes: "Shipping cost from shipment receipt",
        },
      });
    } catch (err) {
      console.error("Freight cost creation failed", err);
    }
  }

  // ─────────────────────────────────────────────
  // 5. TAX CALCULATION for material costs
  // ─────────────────────────────────────────────
  try {
    const newCosts = await prisma.projectCost.findMany({
      where: { shipmentId: shipment.id, costType: "MATERIAL" },
      include: {
        item: { select: { itemNumber: true, taxStatus: true } },
      },
    });

    if (newCosts.length === 0) return NextResponse.json({ ok: true });

    // Get ship-to address from the PO (use first poLink that resolves)
    const poId = newCosts.find((c) => c.poLink)?.poLink ?? null;
    const po = poId
      ? await prisma.purchaseOrder.findUnique({
          where: { id: poId },
          select: { shipToAddress: true },
        })
      : null;

    if (!po?.shipToAddress) return NextResponse.json({ ok: true });

    const taxableCosts = newCosts.filter(
      (c) => c.item?.taxStatus === "TAXABLE" && (c.unitCost ?? 0) > 0,
    );

    if (taxableCosts.length === 0) return NextResponse.json({ ok: true });

    const lineInputs = taxableCosts.map((c, i) => ({
      lineItemNumber: (i + 1) * 10000,
      productCode: c.item?.itemNumber ?? c.itemId ?? "UNKNOWN",
      quantity: c.quantity ?? 1,
    }));

    // Two separate Vertex calls — one for cost, one for sell price
    const [costResult, priceResult] = await Promise.all([
      calculateVertexTax({
        documentNumber: `RCPT-COST-${shipment.id.slice(0, 8).toUpperCase()}`,
        destination: po.shipToAddress,
        lines: lineInputs.map((l, i) => ({
          ...l,
          unitPrice: taxableCosts[i].unitCost ?? 0,
        })),
      }),
      calculateVertexTax({
        documentNumber: `RCPT-PRICE-${shipment.id.slice(0, 8).toUpperCase()}`,
        destination: po.shipToAddress,
        lines: lineInputs.map((l, i) => ({
          ...l,
          unitPrice: taxableCosts[i].unitPrice ?? 0,
        })),
      }),
    ]);

    if (costResult || priceResult) {
      await Promise.all(
        taxableCosts.map((c, i) =>
          prisma.projectCost.update({
            where: { id: c.id },
            data: {
              taxAmount: costResult?.lineTaxes[i]?.taxAmount ?? null,
              taxAmountPrice: priceResult?.lineTaxes[i]?.taxAmount ?? null,
            },
          }),
        ),
      );
    }
  } catch (err) {
    console.error("Tax calculation for project cost failed", err);
    // do NOT throw — allocation already succeeded
  }

  return NextResponse.json({ ok: true });
}
