import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const scopes = await prisma.projectScope.findMany({
    where: { projectId: id },
    include: {
      timeEntries: {
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { date: "desc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(scopes);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { name, estimatedHours } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  }
  const scope = await prisma.projectScope.create({
    data: { projectId: id, name: name.trim(), estimatedHours: estimatedHours ?? 0 },
    include: { timeEntries: true },
  });
  return NextResponse.json(scope, { status: 201 });
}