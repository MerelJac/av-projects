import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { buildQuotePDF } from "@/app/components/team/quotes/QuotePDF";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; quoteId: string }> },
) {
  const { quoteId } = await params;

  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: {
      customer: true,
      lines: { orderBy: { id: "asc" } },
      quoteBundles: true,
    },
  });

  if (!quote) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const buffer = await renderToBuffer(
    buildQuotePDF({
      quoteNumber: quote.id.slice(0, 8).toUpperCase(),
      customerName: quote.customer.name,
      isDirect: quote.isDirect,
      lines: quote.lines.map((l) => ({
        id: l.id,
        description: l.description,
        quantity: l.quantity,
        price: l.price,
        bundleId: l.bundleId,
      })),
      bundles: quote.quoteBundles.map((b) => ({
        id: b.id,
        name: b.name,
        showToCustomer: b.showToCustomer,
      })),
      createdAt: quote.createdAt,
      scopeOfWork: quote.scopeOfWork ?? undefined,
      termsAndConditions: quote.termsAndConditions ?? undefined,
      clientResponsibilities: quote.clientResponsibilities ?? undefined,
    }),
  );

  const preview = req.nextUrl.searchParams.get("preview") === "true";
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": preview
        ? "inline"
        : `attachment; filename="quote-${quote.id.slice(0, 8)}.pdf"`,
    },
  });
}
