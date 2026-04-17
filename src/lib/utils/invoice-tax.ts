// @/lib/utils/invoice-tax.ts
import { prisma } from "@/lib/prisma";
import { calculateVertexTax } from "@/lib/utils/vertex";

type TaxableLine = {
  id: string;
  taxable: boolean;
  price: number;
  quantity: number;
  description: string;
  item?: { id: string; itemNumber?: string | null } | null;
};

type ApplyTaxResult = {
  taxAmount: number;
  amount: number;
  lineTaxes: { invoiceLineId: string; taxAmount: number }[];
};

export async function applyInvoiceTax({
  invoiceId,
  invoiceNumber,
  destination,
  lines,
  isCustomerTaxable,
}: {
  invoiceId: string;
  invoiceNumber: string | null;
  destination: string | null;
  lines: TaxableLine[];
  isCustomerTaxable: boolean;
}): Promise<ApplyTaxResult> {
  const taxableLines = lines.filter((l) => l.taxable);
  const nonTaxableLines = lines.filter((l) => !l.taxable);

  const nonTaxableSubtotal = nonTaxableLines.reduce(
    (s, l) => s + l.price * l.quantity,
    0,
  );

  // No tax applies — zero it out and return full subtotal
  if (!isCustomerTaxable || !taxableLines.length || !destination) {
    const subtotal =
      nonTaxableSubtotal +
      taxableLines.reduce((s, l) => s + l.price * l.quantity, 0);

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { taxAmount: 0, amount: subtotal },
    });

    return { taxAmount: 0, amount: subtotal, lineTaxes: [] };
  }

  const vertexResult = await calculateVertexTax({
    documentNumber: invoiceNumber ?? invoiceId,
    destination,
    lines: taxableLines.map((line, i) => ({
      lineItemNumber: (i + 1) * 10000,
      productCode: line.item?.itemNumber ?? line.item?.id ?? line.description,
      quantity: line.quantity,
      unitPrice: line.price,
    })),
  });
  console.log("Vertex Result: ", vertexResult)

  if (!vertexResult) {
    throw new Error("Tax calculation failed");
  }

  const updated = await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      taxAmount: vertexResult.totalTax,
      amount: vertexResult.totalWithTax + nonTaxableSubtotal,
    },
  });

  await Promise.all(
    taxableLines.map((line, i) => {
      const lt = vertexResult.lineTaxes.find(
        (t) => t.lineItemNumber === (i + 1) * 10000,
      );
      if (!lt) return;
      return prisma.invoiceLine.update({
        where: { id: line.id },
        data: { taxAmount: lt.taxAmount },
      });
    }),
  );

  const lineTaxes = taxableLines.map((line, i) => {
    const lt = vertexResult.lineTaxes.find(
      (t) => t.lineItemNumber === (i + 1) * 10000,
    );
    return { invoiceLineId: line.id, taxAmount: lt?.taxAmount ?? 0 };
  });

  return {
    taxAmount: updated.taxAmount ?? 0,
    amount: updated.amount ?? 0,
    lineTaxes,
  };
}