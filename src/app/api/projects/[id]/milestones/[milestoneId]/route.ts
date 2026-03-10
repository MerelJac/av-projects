import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; milestoneId: string }> },
) {
  const { milestoneId } = await params;
  const { name, dueDate, completed } = await req.json();
  const milestone = await prisma.projectMilestone.update({
    where: { id: milestoneId },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      ...(completed !== undefined && { completed }),
    },
  });
  return NextResponse.json({
    ...milestone,
    dueDate: milestone.dueDate?.toISOString() ?? null,
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; milestoneId: string }> },
) {
  const { milestoneId } = await params;
  await prisma.projectMilestone.delete({ where: { id: milestoneId } });
  return new NextResponse(null, { status: 204 });
}