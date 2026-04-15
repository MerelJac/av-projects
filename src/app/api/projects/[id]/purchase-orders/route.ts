import { prisma } from "@/lib/prisma";
import { buildAddress } from "@/lib/utils/helpers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { vendorId, quoteId, lines } = await req.json();

  if (!vendorId || !lines?.length) {
    return NextResponse.json(
      { error: "Vendor and lines required" },
      { status: 400 },
    );
  }

  const vendor = await prisma.vendor.findUnique({
    where: { id: vendorId },
    select: {
      id: true,
      shipToAddress: true,
      billToAddress: true,
      shippingMethod: true,
      billingTerms: true,
      creditLimit: true,
      defaultBuyerId: true,
    },
  });
  if (!vendor) {
    return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
  }

  // Fetch vendor pricing for all items in this PO so we can mark overrides
  const itemIds = lines
    .map((l: { itemId: string | null }) => l.itemId)
    .filter(Boolean) as string[];
  const vendorPrices = await prisma.vendorItemPrice.findMany({
    where: { vendorId, itemId: { in: itemIds } },
    select: { itemId: true, cost: true },
  });
  const vendorPriceMap = new Map(
    vendorPrices.map((p: { itemId: string; cost: number }) => [
      p.itemId,
      p.cost,
    ]),
  );

  // connect BOM lines to PO

  // Generate a human-readable sequential PO number inside a transaction
  const po = await prisma.$transaction(async (tx) => {
    const poId = `${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
    const poNumber = `PO-AV-${poId}`;
    const project = await tx.project.findFirst({
      where: { id },
      select: {
        customer: {
          select: {
            address: true,
            address2: true,
            city: true,
            state: true,
            zipcode: true,
            country: true,
            billToAddress: true,
            billToAddress2: true,
            billToCity: true,
            billToState: true,
            billToZipcode: true,
            billToCountry: true,
          },
        },
      },
    });
    const projectShipToAddress = buildAddress({
      address1: project?.customer?.address,
      address2: project?.customer?.address2,
      city: project?.customer?.city,
      state: project?.customer?.state,
      zipCode: project?.customer?.zipcode,
      country: project?.customer?.country,
    });

    const projectBillToAddress = buildAddress({
      address1: project?.customer?.billToAddress,
      address2: project?.customer?.billToAddress2,
      city: project?.customer?.billToCity,
      state: project?.customer?.billToState,
      zipCode: project?.customer?.billToZipcode,
      country: project?.customer?.billToCountry,
    });
    return tx.purchaseOrder.create({
      data: {
        id: poId,
        poNumber,
        vendorId,
        projectId: id,
        quoteId: quoteId ?? null,
        status: "DRAFT",
        shipToAddress: projectShipToAddress,
        billToAddress: projectBillToAddress,
        shippingMethod: vendor.shippingMethod,
        billingTerms: vendor.billingTerms,
        creditLimit: vendor.creditLimit,
        buyerId: vendor.defaultBuyerId,
        lines: {
          create: lines.map(
            (l: { itemId: string | null; quantity: number; cost: number }) => {
              const vendorCost = l.itemId
                ? vendorPriceMap.get(l.itemId)
                : undefined;
              const resolvedCost = l.cost ?? vendorCost ?? 0;
              const costOverridden =
                vendorCost !== undefined && resolvedCost !== vendorCost;
              return {
                itemId: l.itemId,
                quantity: l.quantity,
                cost: resolvedCost,
                costOverridden,
                receivedQuantity: 0,
              };
            },
          ),
        },
      },
    });
  });

  return NextResponse.json({ poId: po.id });
}
