import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();
  const {
    name,
    email,
    phone,
    billingTerm,
    taxStatus,
    address,
    address2,
    country,
    city,
    state,
    zipcode,
    billToAddress,
    billToAddress2,
    billToState,
    billToCity,
    billToCountry,
    billToZipcode,
  } = body;

  const customer = await prisma.customer.update({
    where: { id },
    data: {
      name: name || undefined,
      email: email ?? null,
      phone: phone ?? null,
      billingTerm: billingTerm ?? null,
      taxStatus: taxStatus,
      address: address ?? null,
      address2: address2 ?? null,
      country: country ?? null,
      city: city ?? null,
      state: state ?? null,
      zipcode: zipcode ?? null,

      billToAddress: billToAddress ?? null,
      billToAddress2: billToAddress2 ?? null,
      billToCountry: billToCountry ?? null,
      billToCity: billToCity ?? null,
      billToState: billToState ?? null,
      billToZipcode: billToZipcode ?? null,
    },
  });

  return NextResponse.json(customer);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  await prisma.$transaction(async (tx) => {
    await tx.customerItemPrice.deleteMany({ where: { customerId: id } });
    await tx.subscription.deleteMany({ where: { customerId: id } });
    // quotes and projects have their own cascading data — handle as needed
    await tx.quote.deleteMany({ where: { customerId: id } });
    await tx.project.deleteMany({ where: { customerId: id } });
    await tx.customer.delete({ where: { id } });
  });

  return NextResponse.json({ ok: true });
}
