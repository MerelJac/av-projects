// src/app/api/projects/[id]/quotes/[quoteId]/convert/route.ts
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; quoteId: string }> },
) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET! });
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: projectId, quoteId } = await params;

  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: { lines: true },
  });

  if (!quote || quote.projectId !== projectId) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }

  if (quote.status !== "ACCEPTED") {
    return NextResponse.json(
      { error: "Only accepted quotes can be converted to a sales order" },
      { status: 400 },
    );
  }

  // Check if already converted
  const existing = await prisma.salesOrder.findUnique({
    where: { quoteId },
  });
  if (existing) {
    return NextResponse.json(
      { salesOrderId: existing.id, alreadyExisted: true },
      { status: 200 },
    );
  }

  const salesOrder = await prisma.salesOrder.create({
    data: {
      projectId: quote.projectId,
      customerId: quote.customerId,
      quoteId: quote.id,
      status: "OPEN",
      lines: {
        create: quote.lines.map((l) => ({
          description: l.description,
          quantity: l.quantity,
          price: l.price,
          cost: l.cost,
          itemId: l.itemId ?? undefined,
        })),
      },
    },
  });

  return NextResponse.json({ salesOrderId: salesOrder.id }, { status: 201 });
}
