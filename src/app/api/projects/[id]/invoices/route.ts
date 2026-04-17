import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { InvoiceChargeType } from "@prisma/client";
import { applyInvoiceTax } from "@/lib/utils/invoice-tax";
import { buildAddress } from "@/lib/utils/helpers";

type InvoiceLineInput = {
  description: string;
  quantity: number;
  price: number;
  taxable?: boolean;
  quoteLineId?: string | null;
  quoteBundleId?: string | null;
  isBundleTotal?: boolean;
};

type AdditionalLineInput = {
  description: string;
  amount: number;
  taxable?: boolean;
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: projectId } = await params;

  const project = await prisma.project.findFirst({
    where: { id: projectId },
    select: { customerId: true },
  });

  const customer = await prisma.customer.findFirst({
    where: { id: project?.customerId },
    select: { taxStatus: true },
  });

  const isCustomerTaxable = customer?.taxStatus === "TAXABLE";
  const body = await req.json();
  const {
    quoteId,
    chargeType,
    chargePercent,
    lines,
    additionalLines,
    customerName,
    customerEmail,
    customerPhone,
    billToContact,
    billToAddress,
    billToAddress2,
    billToCity,
    billToState,
    billToZipcode,
    billToCountry,
    shipToContact,
    shipToAddress,
    shipToAddress2,
    shipToCity,
    shipToState,
    shipToZipcode,
    shipToCountry,
    billingTerms,
    notes,
    dueDate,
  } = body;

  if (!chargeType) {
    return NextResponse.json({ error: "chargeType required" }, { status: 400 });
  }

  if (chargeType === InvoiceChargeType.PERCENTAGE) {
    if (!chargePercent || chargePercent <= 0 || chargePercent > 100) {
      return NextResponse.json(
        { error: "Valid chargePercent required" },
        { status: 400 },
      );
    }
    if (!quoteId) {
      return NextResponse.json(
        { error: "quoteId required for percentage invoices" },
        { status: 400 },
      );
    }
  }

  const validAdditional: AdditionalLineInput[] = (additionalLines ?? []).filter(
    (l: AdditionalLineInput) => l.description && l.amount > 0,
  );

  if (
    chargeType === InvoiceChargeType.LINE_ITEMS &&
    (!lines || !lines.length) &&
    !validAdditional.length
  ) {
    return NextResponse.json(
      { error: "Lines required for line-item invoices" },
      { status: 400 },
    );
  }

  const additionalTotal = validAdditional.reduce(
    (s: number, l: AdditionalLineInput) => s + l.amount,
    0,
  );

  let amount: number;

  if (chargeType === InvoiceChargeType.PERCENTAGE) {
    const quoteLines = await prisma.quoteLine.findMany({
      where: { quoteId },
      select: { price: true, quantity: true },
    });
    const quoteTotal = quoteLines.reduce((s, l) => s + l.price * l.quantity, 0);
    amount = (chargePercent / 100) * quoteTotal + additionalTotal;
  } else {
    amount =
      (lines as InvoiceLineInput[]).reduce(
        (s, l) => s + l.price * l.quantity,
        0,
      ) + additionalTotal;
  }

  // Resolve itemId for each line from its quoteLineId so inventory can be tracked
  const quoteLineItemMap: Map<string, string> = new Map();
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
    const invoiceId = `${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
    const invoiceNumber = `INV-AV-${invoiceId}`;

    const created = await tx.invoice.create({
      data: {
        id: invoiceId,
        projectId,
        quoteId: quoteId ?? null,
        invoiceNumber,
        chargeType,
        chargePercent:
          chargeType === InvoiceChargeType.PERCENTAGE ? chargePercent : null,
        amount,
        status: "DRAFT",
        issuedAt: new Date() ?? null,
        customerName: customerName ?? null,
        customerEmail: customerEmail ?? null,
        customerPhone: customerPhone ?? null,
        billToContact: billToContact ?? null,
        billToAddress: billToAddress ?? null,
        billToAddress2: billToAddress2 ?? null,
        billToCity: billToCity ?? null,
        billToState: billToState ?? null,
        billToZipcode: billToZipcode ?? null,
        billToCountry: billToCountry ?? null,
        shipToContact: shipToContact ?? null,
        shipToAddress: shipToAddress ?? null,
        shipToAddress2: shipToAddress2 ?? null,
        shipToCity: shipToCity ?? null,
        shipToState: shipToState ?? null,
        shipToZipcode: shipToZipcode ?? null,
        shipToCountry: shipToCountry ?? null,
        billingTerms: billingTerms ?? null,
        notes: notes ?? null,
        dueDate: dueDate ? new Date(dueDate) : null,
        lines: {
          create: [
            ...(chargeType === InvoiceChargeType.LINE_ITEMS
              ? (lines as InvoiceLineInput[]).map((l) => ({
                  description: l.description,
                  quantity: l.quantity,
                  price: l.price,
                  taxable: l.taxable ?? true,
                  quoteLineId: l.quoteLineId ?? null,
                  quoteBundleId: l.quoteBundleId ?? null,
                  isBundleTotal: l.isBundleTotal ?? false,
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  ...(l.quoteLineId && quoteLineItemMap.has(l.quoteLineId)
                    ? { itemId: quoteLineItemMap.get(l.quoteLineId) }
                    : {}),
                }))
              : []),
            ...(chargeType === InvoiceChargeType.PERCENTAGE
              ? [
                  {
                    description: `Progress billing — ${chargePercent}% of proposal total`,
                    quantity: 1,
                    price: amount - additionalTotal, // just the percentage portion, not additional charges
                  },
                ]
              : []),
            ...validAdditional.map((l) => ({
              description: l.description,
              quantity: 1,
              price: l.amount,
              taxable: l.taxable ?? true,
            })),
          ],
        },
      },
    });

    return created;
  });

  // Calculate tax after invoice is created
  const invoiceLines = await prisma.invoiceLine.findMany({
    where: { invoiceId: invoice.id },
    include: { item: { select: { id: true, itemNumber: true } } },
  });

  const destination =
    buildAddress({
      address1: shipToAddress,
      address2: shipToAddress2,
      city: shipToCity,
      state: shipToState,
      zipCode: shipToZipcode,
      country: shipToCountry,
    }) ||
    buildAddress({
      address1: billToAddress,
      address2: billToAddress2,
      city: billToCity,
      state: billToState,
      zipCode: billToZipcode,
      country: billToCountry,
    }) ||
    null;

  await applyInvoiceTax({
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    destination,
    lines: invoiceLines,
    isCustomerTaxable,
  });

  return NextResponse.json({
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
  });
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
