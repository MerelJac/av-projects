import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; poId: string }> }
) {
  const { poId } = await params;
  const { status } = await req.json();
  const po = await prisma.purchaseOrder.update({
    where: { id: poId },
    data: { status },
  });
  return NextResponse.json({ ok: true });
}