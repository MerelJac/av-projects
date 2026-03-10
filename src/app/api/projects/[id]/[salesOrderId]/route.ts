// src/app/api/projects/[id]/sales-orders/[salesOrderId]/route.ts
import { prisma } from "@/lib/prisma";
import { SalesOrderStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; salesOrderId: string }> },
) {
  const { id: projectId, salesOrderId } = await params;

  const salesOrder = await prisma.salesOrder.findUnique({
    where: { id: salesOrderId },
    include: {
      customer: true,
      project: true,
      quote: { select: { id: true } },
      lines: { include: { item: true }, orderBy: { id: "asc" } },
    },
  });

  if (!salesOrder || salesOrder.projectId !== projectId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(salesOrder);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; salesOrderId: string }> },
) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET! });
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: projectId, salesOrderId } = await params;
  const { lines, status } = await req.json();

  const existing = await prisma.salesOrder.findUnique({
    where: { id: salesOrderId },
  });

  if (!existing || existing.projectId !== projectId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Update lines: delete all and re-insert (simple full replace)
  const salesOrder = await prisma.$transaction(async (tx) => {
    await tx.salesOrderLine.deleteMany({ where: { salesOrderId } });

    return tx.salesOrder.update({
      where: { id: salesOrderId },
      data: {
        status: status as SalesOrderStatus,
        lines: {
          create: lines.map((l: any) => ({
            description: l.description,
            quantity: l.quantity,
            price: l.price,
            cost: l.cost ?? null,
            itemId: l.itemId ?? undefined,
          })),
        },
      },
      include: {
        customer: true,
        project: true,
        quote: { select: { id: true } },
        lines: { include: { item: true }, orderBy: { id: "asc" } },
      },
    });
  });

  return NextResponse.json(salesOrder);
}
