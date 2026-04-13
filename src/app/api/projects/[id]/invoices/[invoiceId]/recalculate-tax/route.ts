import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { calculateVertexTax } from "@/lib/utils/vertex";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; invoiceId: string }> },
) {
  const { invoiceId } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      lines: {
        where: { taxable: true },
        include: { item: { select: { id: true } } },
      },
      project: {
        include: { customer: true },
      },
    },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const isCustomerTaxable = invoice.project.customer.taxStatus === "TAXABLE";

  //  RETURN early if not taxable
  if (!isCustomerTaxable) {
    const subtotal = invoice.lines.reduce(
      (s, l) => s + l.price * l.quantity,
      0,
    );

    const updated = await prisma.invoice.update({
      where: { id: invoiceId },
      data: { taxAmount: 0, amount: subtotal },
    });

    return NextResponse.json({
      taxAmount: 0,
      amount: updated.amount,
      lineTaxes: [],
    });
  }

  const destination = invoice.shipToAddress ?? invoice.billToAddress;

  if (!destination) {
    return NextResponse.json(
      { error: "No ship-to or bill-to address on invoice" },
      { status: 400 },
    );
  }

  if (!invoice.lines.length) {
    return NextResponse.json(
      { error: "No taxable lines on invoice" },
      { status: 400 },
    );
  }

  const vertexResult = await calculateVertexTax({
    documentNumber: invoice.invoiceNumber ?? invoice.id,
    destination,
    lines: invoice.lines.map((line, i) => ({
      lineItemNumber: (i + 1) * 10000,
      productCode: line.item?.id ?? line.description,
      quantity: line.quantity,
      unitPrice: line.price,
    })),
  });

  if (!vertexResult) {
    return NextResponse.json(
      { error: "Tax calculation failed" },
      { status: 502 },
    );
  }

  const subtotal = invoice.lines.reduce((s, l) => s + l.price * l.quantity, 0);

  // Update invoice tax + total
  const updated = await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      taxAmount: vertexResult.totalTax,
      amount: subtotal + vertexResult.totalTax,
    },
  });

  // Update per-line tax amounts — match by lineItemNumber (10000, 20000, …)
  await Promise.all(
    invoice.lines.map((line, i) => {
      const lineItemNumber = (i + 1) * 10000;
      const lt = vertexResult.lineTaxes.find(
        (t) => t.lineItemNumber === lineItemNumber,
      );
      if (!lt) return;
      return prisma.invoiceLine.update({
        where: { id: line.id },
        data: { taxAmount: lt.taxAmount },
      });
    }),
  );

  return NextResponse.json({
    taxAmount: updated.taxAmount,
    amount: updated.amount,
    lineTaxes: vertexResult.lineTaxes,
  });
}
