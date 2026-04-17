import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { buildInvoicePDF } from "@/app/components/team/invoices/InvoicePDF";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; invoiceId: string }> },
) {
  const { invoiceId } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { lines: { orderBy: { id: "asc" } } },
  });

  if (!invoice)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const buffer = await renderToBuffer(
    buildInvoicePDF({
      invoiceNumber: invoice.invoiceNumber ?? invoice.id.toUpperCase(),
      customerName: invoice.customerName,
      customerEmail: invoice.customerEmail,
      customerPhone: invoice.customerPhone,
      billToAddress: invoice.billToAddress,
      billToAddress2: (invoice as any).billToAddress2,
      billToCity: (invoice as any).billToCity,
      billToState: (invoice as any).billToState,
      billToZipcode: (invoice as any).billToZipcode,
      billToCountry: (invoice as any).billToCountry,
      shipToAddress: invoice.shipToAddress,
      shipToAddress2: (invoice as any).shipToAddress2,
      shipToCity: (invoice as any).shipToCity,
      shipToState: (invoice as any).shipToState,
      shipToZipcode: (invoice as any).shipToZipcode,
      shipToCountry: (invoice as any).shipToCountry,
      billingTerms: invoice.billingTerms as
        | "NET45"
        | "NET15"
        | "NET30"
        | "PROGRESS"
        | "PREPAID"
        | null,
      chargeType: invoice.chargeType as "LINE_ITEMS" | "PERCENTAGE",
      chargePercent: invoice.chargePercent,
      lines: invoice.lines.map((l) => ({
        id: l.id,
        description: l.description,
        quantity: l.quantity,
        taxAmount: l.taxAmount,
        price: l.price,
        isBundleTotal: l.isBundleTotal,
      })),
      amount: invoice.amount,
      issuedAt: invoice.issuedAt,
      taxAmount: invoice.taxAmount,
      dueDate: invoice.dueDate,
      notes: invoice.notes,
    }),
  );

  const preview = req.nextUrl.searchParams.get("preview") === "true";
  const filename = `invoice-${invoice.invoiceNumber ?? invoice.id.slice(0, 8)}.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": preview
        ? "inline"
        : `attachment; filename="${filename}"`,
    },
  });
}
