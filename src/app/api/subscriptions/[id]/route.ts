import { prisma } from "@/lib/prisma";
import { SubscriptionStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const sub = await prisma.subscription.findUnique({
    where: { id },
    include: {
      item: { select: { id: true, itemNumber: true, manufacturer: true, price: true } },
      customer: { select: { id: true, name: true } },
    },
  });
  if (!sub) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(sub);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();
  const { itemId, startDate, endDate, status, notes } = body;

  if (status && !Object.values(SubscriptionStatus).includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const sub = await prisma.subscription.update({
    where: { id },
    data: {
      ...(itemId !== undefined && { itemId }),
      ...(startDate !== undefined && { startDate: new Date(startDate) }),
      ...(endDate !== undefined && { endDate: new Date(endDate) }),
      ...(status !== undefined && { status }),
      ...(notes !== undefined && { notes: notes?.trim() || null }),
    },
    include: {
      item: { select: { id: true, itemNumber: true, manufacturer: true, price: true } },
      customer: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(sub);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await prisma.subscription.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}