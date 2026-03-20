import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; poId: string }> }
) {
  const { poId } = await params;
  const po = await prisma.purchaseOrder.findUnique({
    where: { id: poId },
    include: {
      vendor: true,
      lines: { include: { item: true } },
      shipments: { include: { lines: { include: { item: true } } }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!po) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(po);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; poId: string }> }
) {
  const { poId } = await params;
  const body = await req.json();
  const { status, notes, vendorId, lines, resend, shipToAddress, billToAddress, shippingMethod, paymentTerms, creditLimit, buyerId } = body;

  // resend=true: bump revision, set sentAt, force status=SENT
  if (resend) {
    const po = await prisma.purchaseOrder.update({
      where: { id: poId },
      data: {
        status: "SENT",
        sentAt: new Date(),
        revision: { increment: 1 },
      },
    });
    return NextResponse.json(po);
  }

  // Line replacements: if `lines` array is provided, replace all lines (for PO edits before resend)
  if (lines) {
    const vendorForPricing = vendorId ?? (await prisma.purchaseOrder.findUnique({
      where: { id: poId },
      select: { vendorId: true },
    }))?.vendorId;

    const itemIds = lines
      .map((l: { itemId: string | null }) => l.itemId)
      .filter(Boolean) as string[];

    const vendorPrices = vendorForPricing
      ? await prisma.vendorItemPrice.findMany({
          where: { vendorId: vendorForPricing, itemId: { in: itemIds } },
          select: { itemId: true, cost: true },
        })
      : [];
    const vendorPriceMap = new Map(vendorPrices.map((p: { itemId: string; cost: number }) => [p.itemId, p.cost]));

    await prisma.$transaction([
      prisma.purchaseOrderLine.deleteMany({ where: { poId } }),
      prisma.purchaseOrder.update({
        where: { id: poId },
        data: {
          ...(status !== undefined && { status }),
          ...(notes !== undefined && { notes: notes ?? null }),
          ...(vendorId !== undefined && { vendorId }),
          lines: {
            create: lines.map((l: {
              itemId: string | null;
              quantity: number;
              cost: number;
              costOverridden?: boolean;
            }) => {
              const vendorCost = l.itemId ? vendorPriceMap.get(l.itemId) : undefined;
              const costOverridden = l.costOverridden ?? (vendorCost !== undefined && l.cost !== vendorCost);
              return {
                itemId: l.itemId,
                quantity: l.quantity,
                cost: l.cost,
                costOverridden,
                receivedQuantity: 0,
              };
            }),
          },
        },
      }),
    ]);

    return NextResponse.json({ ok: true });
  }

  // Simple field updates
  await prisma.purchaseOrder.update({
    where: { id: poId },
    data: {
      ...(status !== undefined && { status }),
      ...(notes !== undefined && { notes: notes ?? null }),
      ...(vendorId !== undefined && { vendorId }),
      ...(shipToAddress !== undefined && { shipToAddress: shipToAddress ?? null }),
      ...(billToAddress !== undefined && { billToAddress: billToAddress ?? null }),
      ...(shippingMethod !== undefined && { shippingMethod: shippingMethod ?? null }),
      ...(paymentTerms !== undefined && { paymentTerms: paymentTerms ?? null }),
      ...(creditLimit !== undefined && { creditLimit: creditLimit ?? null }),
      ...(buyerId !== undefined && { buyerId: buyerId ?? null }),
    },
  });

  return NextResponse.json({ ok: true });
}
