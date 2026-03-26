import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

type ScopeLine = {
  scopeId: string;
  description: string;
  hours: number;
  ratePerHour: number;
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET! });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const { lines } = (await req.json()) as { lines: ScopeLine[] };

  if (!Array.isArray(lines) || lines.length === 0) {
    return NextResponse.json({ error: "lines required" }, { status: 400 });
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { customer: true },
  });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const amount = lines.reduce((sum, l) => sum + l.hours * l.ratePerHour, 0);

  const invoice = await prisma.$transaction(async (tx) => {
    const count = await tx.invoice.count();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

    return tx.invoice.create({
      data: {
        projectId,
        invoiceNumber,
        chargeType: "LINE_ITEMS",
        amount,
        status: "DRAFT",
        customerName: project.customer.name,
        lines: {
          create: lines.map((l) => ({
            description: l.description,
            quantity: l.hours,
            price: l.ratePerHour,
            scopeId: l.scopeId,
          })),
        },
      },
    });
  });

  return NextResponse.json({ invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber });
}
