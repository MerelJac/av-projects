import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { vendorId, quoteId, lines } = await req.json();

  if (!vendorId || !lines?.length) {
    return NextResponse.json({ error: "Vendor and lines required" }, { status: 400 });
  }

  const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
  if (!vendor) {
    return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
  }

  // Fetch vendor pricing for all items in this PO so we can mark overrides
  const itemIds = lines.map((l: { itemId: string | null }) => l.itemId).filter(Boolean) as string[];
  const vendorPrices = await prisma.vendorItemPrice.findMany({
    where: { vendorId, itemId: { in: itemIds } },
    select: { itemId: true, cost: true },
  });
  const vendorPriceMap = new Map(vendorPrices.map((p: { itemId: string; cost: number }) => [p.itemId, p.cost]));

  // Generate a human-readable sequential PO number inside a transaction
  const po = await prisma.$transaction(async (tx) => {
    const count = await tx.purchaseOrder.count();
    const poNumber = `PO-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

    return tx.purchaseOrder.create({
      data: {
        poNumber,
        vendorId,
        projectId: id,
        quoteId: quoteId ?? null,
        status: "DRAFT",
        lines: {
          create: lines.map((l: {
            itemId: string | null;
            quantity: number;
            cost: number;
          }) => {
            const vendorCost = l.itemId ? vendorPriceMap.get(l.itemId) : undefined;
            const resolvedCost = l.cost ?? vendorCost ?? 0;
            const costOverridden = vendorCost !== undefined && resolvedCost !== vendorCost;
            return {
              itemId: l.itemId,
              quantity: l.quantity,
              cost: resolvedCost,
              costOverridden,
              receivedQuantity: 0,
            };
          }),
        },
      },
    });
  });

  return NextResponse.json({ poId: po.id });
}
