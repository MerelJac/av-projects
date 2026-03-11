import { prisma } from "@/lib/prisma";
import { SubscriptionStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

// GET /api/customers/[id]/subscriptions
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const subscriptions = await prisma.subscription.findMany({
    where: { customerId: id },
    include: {
      item: { select: { id: true, itemNumber: true, manufacturer: true, price: true, category: true } },
    },
    orderBy: { endDate: "asc" },
  });
  return NextResponse.json(subscriptions);
}

// POST /api/customers/[id]/subscriptions
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: customerId } = await params;
  const body = await req.json();
  const { itemId, startDate, endDate, status, notes } = body;

  if (!itemId || !startDate || !endDate || !status) {
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
      item: { select: { id: true, itemNumber: true, manufacturer: true, price: true, category: true } },
    },
  });

  return NextResponse.json(subscription, { status: 201 });
}