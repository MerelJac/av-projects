import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { buildPOPDF } from "@/app/components/team/purchase-orders/POPDF";
import { buildAddress } from "@/lib/utils/helpers";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; poId: string }> },
) {
  const { poId } = await params;

  const po = await prisma.purchaseOrder.findUnique({
    where: { id: poId },
    include: {
      vendor: { select: { id: true, name: true } },
      buyer: { include: { profile: { select: { firstName: true, lastName: true } } } },
      lines: {
        include: { item: { select: { itemNumber: true, manufacturer: true, description: true } } },
      },
    },
  });

  if (!po) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const buyerName = po.buyer?.profile
    ? `${po.buyer.profile.firstName} ${po.buyer.profile.lastName}`
    : null;

  const buffer = await renderToBuffer(
    buildPOPDF({
      poNumber: po.poNumber ?? po.id.toUpperCase(),
      createdAt: po.createdAt,
      vendorName: po.vendor?.name ?? "Unknown Vendor",
      vendorAddress: null,
      shipToAddress: [po.shipToContact, buildAddress({ address1: po.shipToAddress, address2: po.shipToAddress2, city: po.shipToCity, state: po.shipToState, zipCode: po.shipToZipcode, country: po.shipToCountry })].filter(Boolean).join("\n") || null,
      billToAddress: [po.billToContact, buildAddress({ address1: po.billToAddress, address2: po.billToAddress2, city: po.billToCity, state: po.billToState, zipCode: po.billToZipcode, country: po.billToCountry })].filter(Boolean).join("\n") || null,
      shippingMethod: po.shippingMethod,
      billingTerms: po.billingTerms,
      buyerName,
      vendorId: po.vendor?.id?.toUpperCase() ?? "—",
      lines: po.lines.map((l) => ({
        id: l.id,
        itemNumber: l.item?.itemNumber ?? "—",
        manufacturer: l.item?.manufacturer ?? null,
        description: l.item?.description ?? null,
        quantity: l.quantity,
        cost: l.cost,
      })),
    }),
  );

  const preview = req.nextUrl.searchParams.get("preview") === "true";
  const filename = `${po.poNumber ?? "PO"}.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": preview ? "inline" : `attachment; filename="${filename}"`,
    },
  });
}
