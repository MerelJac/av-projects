import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; quoteId: string }> },
) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET! });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, quoteId } = await params;

  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: {
      lines: { include: { item: true } },
      salesOrder: true,
    },
  });

  if (!quote) return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  if (quote.status !== "ACCEPTED") return NextResponse.json({ error: "Quote must be ACCEPTED" }, { status: 400 });
  if (quote.salesOrder) return NextResponse.json({ salesOrderId: quote.salesOrder.id, alreadyExisted: true });

  const hardwareLines = quote.lines.filter(
    (l) => !l.item || l.item.type !== "SERVICE"
  );
  const serviceLines = quote.lines.filter(
    (l) => l.item?.type === "SERVICE"
  );

  const result = await prisma.$transaction(async (tx) => {
    // Create sales order (hardware lines only)
    const so = await tx.salesOrder.create({
      data: {
        projectId,
        customerId: quote.customerId,
        quoteId: quote.id,
        lines: {
          create: hardwareLines.map((l) => ({
            description: l.description,
            quantity: l.quantity,
            price: l.price,
            cost: l.cost ?? null,
            itemId: l.itemId ?? null,
          })),
        },
      },
    });

    // Auto-create project scopes from service lines
    for (const line of serviceLines) {
      // Avoid duplicates if scope for this item already exists
      const existing = line.itemId
        ? await tx.projectScope.findFirst({
            where: { projectId, itemId: line.itemId },
          })
        : null;

      if (!existing) {
        await tx.projectScope.create({
          data: {
            projectId,
            itemId: line.itemId ?? null,
            name: line.description,
            estimatedHours: line.quantity,
          },
        });
      }
    }

    return so;
  });

  return NextResponse.json({ salesOrderId: result.id });
}