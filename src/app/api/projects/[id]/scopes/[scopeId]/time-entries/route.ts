import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; scopeId: string }> },
) {
  const { id: projectId, scopeId } = await params;
  const { userId, hours, notes, date } = await req.json();

  if (!userId || !hours || hours <= 0) {
    return NextResponse.json({ error: "userId and hours required" }, { status: 400 });
  }

  const entry = await prisma.timeEntry.create({
    data: {
      projectId,
      scopeId,
      userId,
      hours,
      notes: notes ?? null,
      date: date ? new Date(date) : new Date(),
    },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  return NextResponse.json(entry, { status: 201 });
}