import { prisma } from "@/lib/prisma";
import { SubscriptionStatus } from "@prisma/client";
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
      item: { select: { id: true, itemNumber: true, manufacturer: true, price: true } },
      customer: { select: { id: true, name: true } },
    },
    orderBy: { endDate: "asc" },
  });

  return NextResponse.json(subscriptions);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { itemId, customerId, startDate, endDate, status, notes } = body;

  if (!itemId || !customerId || !startDate || !endDate || !status) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
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
    },
    include: {
      item: { select: { id: true, itemNumber: true, manufacturer: true, price: true } },
      customer: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(subscription, { status: 201 });
}