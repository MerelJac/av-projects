import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { buildPOPDF } from "@/app/components/team/purchase-orders/POPDF";

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

  if (!po || !po.buyer) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const buyerName = po.buyer?.profile
    ? `${po.buyer.profile.firstName} ${po.buyer.profile.lastName}`
    : null;

  const buffer = await renderToBuffer(
    buildPOPDF({
      poNumber: po.poNumber ?? po.id.slice(0, 8).toUpperCase(),
      createdAt: po.createdAt,
      vendorName: po.vendor?.name ?? "Unknown Vendor",
      vendorAddress: null,
      shipToAddress: po.shipToAddress,
      billToAddress: po.billToAddress,
      shippingMethod: po.shippingMethod,
      paymentTerms: po.paymentTerms,
      buyerName,
      vendorId: po.vendor?.id?.slice(0, 8).toUpperCase() ?? "—",
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
