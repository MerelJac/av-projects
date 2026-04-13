import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { name, email, phone, billingTerm, taxStatus } = body;

  const customer = await prisma.customer.update({
    where: { id },
    data: {
      name: name || undefined,
      email: email ?? null,
      phone: phone ?? null,
      billingTerm: billingTerm ?? null,
      taxStatus: taxStatus
    },
  });

  return NextResponse.json(customer);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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