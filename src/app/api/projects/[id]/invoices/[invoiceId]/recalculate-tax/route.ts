import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { applyInvoiceTax } from "@/lib/utils/invoice-tax";
import { buildAddress } from "@/lib/utils/helpers";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; invoiceId: string }> },
) {
  const { invoiceId } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      lines: {
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
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const inv = invoice as any;
    const destination =
      buildAddress({ address1: inv.shipToAddress, address2: inv.shipToAddress2, city: inv.shipToCity, state: inv.shipToState, zipCode: inv.shipToZipcode, country: inv.shipToCountry }) ||
      buildAddress({ address1: inv.billToAddress, address2: inv.billToAddress2, city: inv.billToCity, state: inv.billToState, zipCode: inv.billToZipcode, country: inv.billToCountry }) ||
      null;
    const result = await applyInvoiceTax({
      invoiceId,
      invoiceNumber: invoice.invoiceNumber,
      destination,
      lines: invoice.lines,
      isCustomerTaxable: invoice.project.customer.taxStatus === "TAXABLE",
    });
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof Error && e.message === "Tax calculation failed") {
      return NextResponse.json({ error: e.message }, { status: 502 });
    }
    throw e;
  }
}
