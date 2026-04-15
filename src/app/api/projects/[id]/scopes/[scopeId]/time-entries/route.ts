import { prisma } from "@/lib/prisma";
import { calculateVertexTax } from "@/lib/utils/vertex";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; scopeId: string }> },
) {
  const { id: projectId, scopeId } = await params;
  const { userId, hours, notes, date } = await req.json();

  if (!userId || !hours || hours <= 0) {
    return NextResponse.json(
      { error: "userId and hours required" },
      { status: 400 },
    );
  }

  const entry = await prisma.timeEntry.create({
    data: {
      projectId,
      scopeId,
      userId,
      hours,
      notes: notes ?? null,
      date: date ? new Date(date) : new Date(),
    },
    include: { user: { include: { profile: true } } },
  });

  // Create a LABOR project cost if the scope has a cost rate
  const scope = await prisma.projectScope.findUnique({
    where: { id: scopeId },
    select: { costPerHour: true, ratePerHour: true, itemId: true },
  });

  let laborCost = null;
  if (scope?.costPerHour) {
    const unitCost = scope.costPerHour;
    const unitPrice = scope.ratePerHour;
    laborCost = await prisma.projectCost.create({
      data: {
        projectId,
        itemId: scope.itemId ?? null,
        costType: "LABOR",
        unitCost,
        unitPrice: unitPrice ?? null,
        quantity: hours,
        amount: unitCost * hours,
        amountPrice: unitPrice ? unitPrice * hours : null,
        notes: "Auto-populated when time was logged.",
      },
      include: {
        item: { select: { itemNumber: true, taxStatus: true } },
      },
    });
  }

  // ─────────────────────────────────────────────
  // TAX CALCULATION for the labor cost
  // ─────────────────────────────────────────────
  if (laborCost) {
    try {
      if (
        laborCost.item?.taxStatus !== "TAXABLE" ||
        (laborCost.unitCost ?? 0) <= 0
      ) {
        return NextResponse.json(entry, { status: 201 });
      }

      // Get ship-to address from a PO linked to this project
      const poLink = await prisma.purchaseOrder.findFirst({
        where: { projectId },
        select: { shipToAddress: true },
      });

      if (!poLink?.shipToAddress) {
        return NextResponse.json(entry, { status: 201 });
      }

      const lineInput = {
        lineItemNumber: 10000,
        productCode: laborCost.item?.itemNumber ?? laborCost.itemId ?? "LABOR",
        quantity: laborCost.quantity ?? hours,
      };

      // Two separate Vertex calls — one for cost, one for sell price
      const [costResult, priceResult] = await Promise.all([
        calculateVertexTax({
          documentNumber: `TIME-COST-${entry.id.slice(0, 8).toUpperCase()}`,
          destination: poLink.shipToAddress,
          lines: [{ ...lineInput, unitPrice: laborCost.unitCost ?? 0 }],
        }),
        calculateVertexTax({
          documentNumber: `TIME-PRICE-${entry.id.slice(0, 8).toUpperCase()}`,
          destination: poLink.shipToAddress,
          lines: [{ ...lineInput, unitPrice: laborCost.unitPrice ?? 0 }],
        }),
      ]);

      if (costResult || priceResult) {
        await prisma.projectCost.update({
          where: { id: laborCost.id },
          data: {
            taxAmount: costResult?.lineTaxes[0]?.taxAmount ?? null,
            taxAmountPrice: priceResult?.lineTaxes[0]?.taxAmount ?? null,
          },
        });
      }
    } catch (err) {
      console.error("Tax calculation for labor cost failed", err);
      // do NOT throw — time entry and labor cost already succeeded
    }
  }

  return NextResponse.json(entry, { status: 201 });
}
