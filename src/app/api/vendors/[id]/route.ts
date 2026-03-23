import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const vendor = await prisma.vendor.findUnique({
    where: { id },
    include: {
      itemPrices: {
        include: { item: { select: { id: true, itemNumber: true, manufacturer: true, description: true } } },
        orderBy: { updatedAt: "desc" },
      },
      _count: { select: { purchaseOrders: true } },
    },
  });
  if (!vendor) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(vendor);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { name, email, phone, notes, active, shipToAddress, billToAddress, shippingMethod, billingTerms, creditLimit, defaultBuyerId } = await req.json();
  const vendor = await prisma.vendor.update({
    where: { id },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(email !== undefined && { email: email?.trim() || null }),
      ...(phone !== undefined && { phone: phone?.trim() || null }),
      ...(notes !== undefined && { notes: notes?.trim() || null }),
      ...(active !== undefined && { active }),
      ...(shipToAddress !== undefined && { shipToAddress: shipToAddress?.trim() || null }),
      ...(billToAddress !== undefined && { billToAddress: billToAddress?.trim() || null }),
      ...(shippingMethod !== undefined && { shippingMethod: shippingMethod?.trim() || null }),
      ...(billingTerms !== undefined && { billingTerms: billingTerms?.trim() || null }),
      ...(creditLimit !== undefined && { creditLimit: creditLimit !== null ? creditLimit : null }),
      ...(defaultBuyerId !== undefined && { defaultBuyerId: defaultBuyerId || null }),
    },
  });
  return NextResponse.json(vendor);
}
