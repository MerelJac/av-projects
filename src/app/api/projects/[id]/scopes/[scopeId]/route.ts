import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; scopeId: string }> },
) {
  const { scopeId } = await params;
  const { name, estimatedHours } = await req.json();
  const scope = await prisma.projectScope.update({
    where: { id: scopeId },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(estimatedHours !== undefined && { estimatedHours }),
    },
    include: {
      timeEntries: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });
  return NextResponse.json(scope);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; scopeId: string }> },
) {
  const { scopeId } = await params;
  await prisma.projectScope.delete({ where: { id: scopeId } });
  return new NextResponse(null, { status: 204 });
}