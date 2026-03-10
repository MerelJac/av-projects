import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const milestones = await prisma.projectMilestone.findMany({
    where: { projectId: id },
    orderBy: { dueDate: "asc" },
  });
  // Serialize dates
  return NextResponse.json(
    milestones.map((m) => ({
      ...m,
      dueDate: m.dueDate?.toISOString() ?? null,
    }))
  );
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { name, dueDate } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  }
  const milestone = await prisma.projectMilestone.create({
    data: {
      projectId: id,
      name: name.trim(),
      dueDate: dueDate ? new Date(dueDate) : null,
    },
  });
  return NextResponse.json({
    ...milestone,
    dueDate: milestone.dueDate?.toISOString() ?? null,
  }, { status: 201 });
}