import { prisma } from "@/lib/prisma";
import { buildAuditLog } from "@/lib/audit";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { InvoiceStatus } from "@prisma/client";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; invoiceId: string }> },
) {
  const { id: projectId, invoiceId } = await params;
  const body = await req.json();

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: { projectId: true, status: true },
  });

  if (!invoice || invoice.projectId !== projectId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? null;

  const data: Record<string, unknown> = {};

  if (body.status !== undefined) {
    if (!Object.values(InvoiceStatus).includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    data.status = body.status;
    if (body.status === InvoiceStatus.PAID && !body.paidAt) {
      data.paidAt = new Date();
    }
    if (body.status === InvoiceStatus.SENT && !body.issuedAt) {
      data.issuedAt = new Date();
    }
  }

  if (body.customerName !== undefined) data.customerName = body.customerName;
  if (body.customerEmail !== undefined) data.customerEmail = body.customerEmail;
  if (body.customerPhone !== undefined) data.customerPhone = body.customerPhone;
  if (body.billToAddress !== undefined) data.billToAddress = body.billToAddress;
  if (body.shipToAddress !== undefined) data.shipToAddress = body.shipToAddress;
  if (body.billingTerms !== undefined) data.billingTerms = body.billingTerms;
  if (body.notes !== undefined) data.notes = body.notes;
  if (body.dueDate !== undefined) data.dueDate = body.dueDate ? new Date(body.dueDate) : null;
  if (body.issuedAt !== undefined) data.issuedAt = body.issuedAt ? new Date(body.issuedAt) : null;
  if (body.paidAt !== undefined) data.paidAt = body.paidAt ? new Date(body.paidAt) : null;

  const statusChanged = body.status !== undefined && body.status !== invoice.status;

  const [updated] = await prisma.$transaction([
    prisma.invoice.update({
      where: { id: invoiceId },
      data,
      include: { lines: true },
    }),
    prisma.auditLog.create({
      data: buildAuditLog(
        "INVOICE",
        invoiceId,
        statusChanged ? "STATUS_CHANGE" : "UPDATE",
        userId,
        statusChanged
          ? `Status changed from ${invoice.status} to ${body.status}`
          : "Invoice updated"
      ),
    }),
  ]);

  return NextResponse.json(updated);
}
