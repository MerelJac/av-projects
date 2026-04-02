import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { InvoiceChargeType } from "@prisma/client";

type InvoiceLineInput = {
  description: string;
  quantity: number;
  price: number;
  quoteLineId?: string | null;
  quoteBundleId?: string | null;
  isBundleTotal?: boolean;
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: projectId } = await params;

  const body = await req.json();
  const {
    quoteId,
    chargeType,
    chargePercent,
    lines,
    customerName,
    customerEmail,
    customerPhone,
    billToAddress,
    shipToAddress,
    billingTerms,
    notes,
    dueDate,
  } = body;

  if (!chargeType) {
    return NextResponse.json({ error: "chargeType required" }, { status: 400 });
  }

  if (chargeType === InvoiceChargeType.PERCENTAGE) {
    if (!chargePercent || chargePercent <= 0 || chargePercent > 100) {
      return NextResponse.json({ error: "Valid chargePercent required" }, { status: 400 });
    }
    if (!quoteId) {
      return NextResponse.json({ error: "quoteId required for percentage invoices" }, { status: 400 });
    }
  }

  if (chargeType === InvoiceChargeType.LINE_ITEMS && (!lines || !lines.length)) {
    return NextResponse.json({ error: "Lines required for line-item invoices" }, { status: 400 });
  }

  let amount: number;

  if (chargeType === InvoiceChargeType.PERCENTAGE) {
    // Get quote total from its lines
    const quoteLines = await prisma.quoteLine.findMany({
      where: { quoteId },
      select: { price: true, quantity: true },
    });
    const quoteTotal = quoteLines.reduce((s, l) => s + l.price * l.quantity, 0);
    amount = (chargePercent / 100) * quoteTotal;
  } else {
    amount = (lines as InvoiceLineInput[]).reduce(
      (s, l) => s + l.price * l.quantity,
      0,
    );
  }

  // Resolve itemId for each line from its quoteLineId so inventory can be tracked
  let quoteLineItemMap: Map<string, string> = new Map();
  if (chargeType === InvoiceChargeType.LINE_ITEMS) {
    const quoteLineIds = (lines as InvoiceLineInput[])
      .map((l) => l.quoteLineId)
      .filter((id): id is string => !!id);
    if (quoteLineIds.length > 0) {
      const quoteLines = await prisma.quoteLine.findMany({
        where: { id: { in: quoteLineIds } },
        select: { id: true, itemId: true },
      });
      for (const ql of quoteLines) {
        if (ql.itemId) quoteLineItemMap.set(ql.id, ql.itemId);
      }
    }
  }

  const invoice = await prisma.$transaction(async (tx) => {
    const count = await tx.invoice.count();
    const invoiceId = `${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;
    const invoiceNumber = `INV-AV-${invoiceId}`;

    const created = await tx.invoice.create({
      data: {
        id: invoiceId,
        projectId,
        quoteId: quoteId ?? null,
        invoiceNumber,
        chargeType,
        chargePercent: chargeType === InvoiceChargeType.PERCENTAGE ? chargePercent : null,
        amount,
        status: "DRAFT",
        customerName: customerName ?? null,
        customerEmail: customerEmail ?? null,
        customerPhone: customerPhone ?? null,
        billToAddress: billToAddress ?? null,
        shipToAddress: shipToAddress ?? null,
        billingTerms: billingTerms ?? null,
        notes: notes ?? null,
        dueDate: dueDate ? new Date(dueDate) : null,
        lines:
          chargeType === InvoiceChargeType.LINE_ITEMS
            ? {
                create: (lines as InvoiceLineInput[]).map((l) => ({
                  description: l.description,
                  quantity: l.quantity,
                  price: l.price,
                  quoteLineId: l.quoteLineId ?? null,
                  quoteBundleId: l.quoteBundleId ?? null,
                  isBundleTotal: l.isBundleTotal ?? false,
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  ...(l.quoteLineId && quoteLineItemMap.has(l.quoteLineId) ? { itemId: quoteLineItemMap.get(l.quoteLineId) } : {}),
                })),
              }
            : undefined,
      },
    });

    // Build inventory movements from the input lines — avoids reading itemId
    // from the returned DB object before the migration types are available.
    if (chargeType === InvoiceChargeType.LINE_ITEMS) {
      const movementData = (lines as InvoiceLineInput[])
        .filter((l) => l.quoteLineId && quoteLineItemMap.has(l.quoteLineId) && l.quantity > 0)
        .map((l) => ({
          itemId: quoteLineItemMap.get(l.quoteLineId!)!,
          type: "INVOICE" as const,
          quantityDelta: -Math.round(l.quantity),
          invoiceId: created.id,
          notes: `Invoiced on ${invoiceNumber}`,
        }));
      if (movementData.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (tx as any).inventoryMovement.createMany({ data: movementData });
      }
    }

    return created;
  });

  return NextResponse.json({ invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: projectId } = await params;

  const invoices = await prisma.invoice.findMany({
    where: { projectId },
    include: {
      quote: { select: { id: true } },
      lines: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(invoices);
}
