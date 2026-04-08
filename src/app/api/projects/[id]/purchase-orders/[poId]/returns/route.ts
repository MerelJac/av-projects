import { prisma } from "@/lib/prisma";
import { buildAuditLog } from "@/lib/audit";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; poId: string }> }
) {
  const { poId } = await params;
  const returns = await prisma.purchaseOrderReturn.findMany({
    where: { poId },
    include: {
      lines: { include: { poLine: { include: { item: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(returns);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; poId: string }> }
) {
  const { poId } = await params;
  const body = await req.json();
  const { reason, rmaNumber, notes, disposition, lines } = body as {
    reason?: string;
    rmaNumber?: string;
    notes?: string;
    disposition?: "RETURN_TO_VENDOR" | "KEEP_IN_INVENTORY";
    lines: { poLineId: string; quantity: number; creditPerUnit?: number }[];
  };

  if (!lines?.length) {
    return NextResponse.json({ error: "At least one line required" }, { status: 400 });
  }

  // Validate quantities don't exceed available (receivedQuantity - already credited returns)
  const poLines = await prisma.purchaseOrderLine.findMany({
    where: { id: { in: lines.map((l) => l.poLineId) }, poId },
    include: {
      returnLines: {
        where: { poReturn: { status: { in: ["PENDING", "SENT", "CREDITED"] } } },
        select: { quantity: true },
      },
    },
  });

  for (const l of lines) {
    const poLine = poLines.find((p) => p.id === l.poLineId);
    if (!poLine) {
      return NextResponse.json({ error: `Line ${l.poLineId} not found on this PO` }, { status: 400 });
    }
    const alreadyInReturn = poLine.returnLines.reduce((s, r) => s + r.quantity, 0);
    const available = poLine.receivedQuantity - alreadyInReturn;
    if (l.quantity > available) {
      return NextResponse.json(
        { error: `Cannot return ${l.quantity} of ${poLine.itemId} — only ${available} available to return` },
        { status: 400 }
      );
    }
  }

  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? null;

  // Generate return number
  const count = await prisma.purchaseOrderReturn.count({ where: { poId } });
  const returnNumber = `RTN-${count + 1}`;

  const totalQty = lines.reduce((s, l) => s + l.quantity, 0);

  const [created] = await prisma.$transaction([
    prisma.purchaseOrderReturn.create({
      data: {
        returnNumber,
        poId,
        reason: reason ?? null,
        rmaNumber: rmaNumber ?? null,
        notes: notes ?? null,
        disposition: disposition ?? "RETURN_TO_VENDOR",
        lines: {
          create: lines.map((l) => ({
            poLineId: l.poLineId,
            quantity: l.quantity,
            creditPerUnit: l.creditPerUnit ?? null,
          })),
        },
      },
      include: {
        lines: { include: { poLine: { include: { item: true } } } },
      },
    }),
    prisma.auditLog.create({
      data: buildAuditLog(
        "PURCHASE_ORDER",
        poId,
        "CREATE",
        userId,
        `Return ${returnNumber} created (${totalQty} unit${totalQty !== 1 ? "s" : ""}${reason ? ` — ${reason}` : ""})`
      ),
    }),
  ]);

  return NextResponse.json(created, { status: 201 });
}
