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

  // Verify vendor exists
  const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
  if (!vendor) {
    return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
  }

  const po = await prisma.purchaseOrder.create({
    data: {
      vendorId,
      projectId: id,
      quoteId: quoteId ?? null,
      status: "DRAFT",
      lines: {
        create: lines.map((l: {
          itemId: string | null;
          quantity: number;
          cost: number;
        }) => ({
          itemId: l.itemId,
          quantity: l.quantity,
          cost: l.cost,
          receivedQuantity: 0,
        })),
      },
    },
  });

  return NextResponse.json({ poId: po.id });
}