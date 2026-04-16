import { prisma } from "@/lib/prisma";
import { calculateVertexTax } from "@/lib/utils/vertex";
import { ProjectCostType, SubscriptionStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as SubscriptionStatus | null;
  const customerId = searchParams.get("customerId");

  const subscriptions = await prisma.subscription.findMany({
    where: {
      ...(status && { status }),
      ...(customerId && { customerId }),
    },
    include: {
      item: {
        select: { id: true, itemNumber: true, manufacturer: true, price: true },
      },
      customer: { select: { id: true, name: true } },
    },
    orderBy: { endDate: "asc" },
  });

  return NextResponse.json(subscriptions);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    itemId,
    customerId,
    startDate,
    endDate,
    status,
    notes,
    projectId,
    quantity,
    cost,
    price,
    billingCycle,
    shipToAddress,
    poId,
  } = body;

  if (!itemId || !customerId || !startDate || !endDate || !status) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  if (!Object.values(SubscriptionStatus).includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const subscription = await prisma.subscription.create({
    data: {
      itemId,
      customerId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status,
      notes: notes?.trim() || null,
      projectId: projectId || null,
      quantity: quantity != null ? Number(quantity) : null,
      cost: cost != null ? Number(cost) : null,
      price: price != null ? Number(price) : null,
      billingCycle: billingCycle || null,
    },
    include: {
      item: {
        select: { id: true, itemNumber: true, manufacturer: true, price: true },
      },
      customer: { select: { id: true, name: true } },
    },
  });

  const item = await prisma.item.findFirst({ where: { id: itemId } });
  const customer = await prisma.customer.findFirst({ where: { id: customerId } });
  
  let costResult = null;
  let priceResult = null;

  if (item?.taxStatus === "TAXABLE" && customer?.taxStatus === "TAXABLE" && shipToAddress) {
    const lineBase = {
      productCode: item.itemNumber,
      productClass: "TAXABLE",
      quantity: Number(quantity) || 1,
    };

    [costResult, priceResult] = await Promise.all([
      calculateVertexTax({
        documentNumber: `RCPT-COST-${subscription.id.slice(0, 8).toUpperCase()}`,
        destination: shipToAddress,
        lines: [{ ...lineBase, unitPrice: Number(cost) || 0 }],
      }),
      calculateVertexTax({
        documentNumber: `RCPT-PRICE-${subscription.id.slice(0, 8).toUpperCase()}`,
        destination: shipToAddress,
        lines: [{ ...lineBase, unitPrice: Number(price) || 0 }],
      }),
    ]);
  }

  if (projectId) {
    await prisma.projectCost.create({
      data: {
        projectId,
        costType: ProjectCostType.SUBSCRIPTION,
        quantity: quantity != null ? Number(quantity) : null,
        amount: (Number(cost) || 0) * (Number(quantity) || 1),
        unitCost: Number(cost) || 0,
        taxAmount: costResult?.totalTax ?? null,
        poLink: poId || null,
        amountPrice: (Number(price) || 0) * (Number(quantity) || 1),
        unitPrice: Number(price) || 0,
        taxAmountPrice: priceResult?.totalTax ?? null,
        itemId,
        subscriptionId: subscription.id,
      },
    });
  }

  return NextResponse.json(subscription, { status: 201 });
}
