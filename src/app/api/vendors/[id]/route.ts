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
  const {
    name, email, phone, notes, active,
    shipToContact, shipToAddress, shipToAddress2, shipToCity, shipToState, shipToZipcode, shipToCountry,
    billToContact, billToAddress, billToAddress2, billToCity, billToState, billToZipcode, billToCountry,
    shippingMethod, billingTerms, creditLimit, defaultBuyerId
  } = await req.json();
  const trim = (v: string | null | undefined) => v?.trim() || null;
  const vendor = await prisma.vendor.update({
    where: { id },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(email !== undefined && { email: trim(email) }),
      ...(phone !== undefined && { phone: trim(phone) }),
      ...(notes !== undefined && { notes: trim(notes) }),
      ...(active !== undefined && { active }),
      ...(shipToContact !== undefined && { shipToContact: trim(shipToContact) }),
      ...(shipToAddress !== undefined && { shipToAddress: trim(shipToAddress) }),
      ...(shipToAddress2 !== undefined && { shipToAddress2: trim(shipToAddress2) }),
      ...(shipToCity !== undefined && { shipToCity: trim(shipToCity) }),
      ...(shipToState !== undefined && { shipToState: trim(shipToState) }),
      ...(shipToZipcode !== undefined && { shipToZipcode: trim(shipToZipcode) }),
      ...(shipToCountry !== undefined && { shipToCountry: trim(shipToCountry) }),
      ...(billToContact !== undefined && { billToContact: trim(billToContact) }),
      ...(billToAddress !== undefined && { billToAddress: trim(billToAddress) }),
      ...(billToAddress2 !== undefined && { billToAddress2: trim(billToAddress2) }),
      ...(billToCity !== undefined && { billToCity: trim(billToCity) }),
      ...(billToState !== undefined && { billToState: trim(billToState) }),
      ...(billToZipcode !== undefined && { billToZipcode: trim(billToZipcode) }),
      ...(billToCountry !== undefined && { billToCountry: trim(billToCountry) }),
      ...(shippingMethod !== undefined && { shippingMethod: trim(shippingMethod) }),
      ...(billingTerms !== undefined && { billingTerms: billingTerms?.trim() || null }),
      ...(creditLimit !== undefined && { creditLimit: creditLimit ?? null }),
      ...(defaultBuyerId !== undefined && { defaultBuyerId: defaultBuyerId || null }),
    },
  });
  return NextResponse.json(vendor);
}
