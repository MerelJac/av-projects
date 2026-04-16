import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; quoteId: string }> }
) {
  const { quoteId } = await params;
  const { depositPct, depositAmount, depositPaid, depositPaidAt } = await req.json();

  await prisma.quote.update({
    where: { id: quoteId },
    data: {
      depositPct: depositPct ?? null,
      depositAmount: depositAmount ?? null,
      depositPaid: depositPaid ?? false,
      depositPaidAt: depositPaidAt ? new Date(depositPaidAt) : null,
    },
  });

  return NextResponse.json({ ok: true });
}