import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  req: NextRequest,
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