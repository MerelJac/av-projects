import { prisma } from "@/lib/prisma";
import { buildAuditLog } from "@/lib/audit";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
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
  const { status, notes, vendorId, lines, resend, shipToAddress, billToAddress, shippingMethod, billingTerms, creditLimit, buyerId } = body;

  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? null;

  // resend=true: bump revision, set sentAt, force status=SENT
  if (resend) {
    const existing = await prisma.purchaseOrder.findUnique({
      where: { id: poId },
      select: { revision: true },
    });
    const po = await prisma.$transaction([
      prisma.purchaseOrder.update({
        where: { id: poId },
        data: {
          status: "SENT",
          sentAt: new Date(),
          revision: { increment: 1 },
        },
      }),
      prisma.auditLog.create({
        data: buildAuditLog(
          "PURCHASE_ORDER",
          poId,
          "STATUS_CHANGE",
          userId,
          `Resent to vendor (revision ${(existing?.revision ?? 0) + 1})`
        ),
      }),
    ]);
    return NextResponse.json(po[0]);
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
      prisma.auditLog.create({
        data: buildAuditLog("PURCHASE_ORDER", poId, "UPDATE", userId, "Lines updated"),
      }),
    ]);

    return NextResponse.json({ ok: true });
  }

  // Simple field updates
  const existing = await prisma.purchaseOrder.findUnique({
    where: { id: poId },
    select: { status: true },
  });

  await prisma.$transaction([
    prisma.purchaseOrder.update({
      where: { id: poId },
      data: {
        ...(status !== undefined && { status }),
        ...(notes !== undefined && { notes: notes ?? null }),
        ...(vendorId !== undefined && { vendorId }),
        ...(shipToAddress !== undefined && { shipToAddress: shipToAddress ?? null }),
        ...(billToAddress !== undefined && { billToAddress: billToAddress ?? null }),
        ...(shippingMethod !== undefined && { shippingMethod: shippingMethod ?? null }),
        ...(billingTerms !== undefined && { billingTerms: billingTerms ?? null }),
        ...(creditLimit !== undefined && { creditLimit: creditLimit ?? null }),
        ...(buyerId !== undefined && { buyerId: buyerId ?? null }),
      },
    }),
    prisma.auditLog.create({
      data: buildAuditLog(
        "PURCHASE_ORDER",
        poId,
        status !== undefined && status !== existing?.status ? "STATUS_CHANGE" : "UPDATE",
        userId,
        status !== undefined && status !== existing?.status
          ? `Status changed from ${existing?.status} to ${status}`
          : "Details updated"
      ),
    }),
  ]);

  return NextResponse.json({ ok: true });
}
