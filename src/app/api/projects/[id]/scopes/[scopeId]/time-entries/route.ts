import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; scopeId: string }> },
) {
  const { id: projectId, scopeId } = await params;
  const { userId, hours, notes, date } = await req.json();

  if (!userId || !hours || hours <= 0) {
    return NextResponse.json(
      { error: "userId and hours required" },
      { status: 400 },
    );
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
    include: { user: { include: { profile: true } } },
  });

  // Create a LABOR project cost if the scope has a cost rate
  const scope = await prisma.projectScope.findUnique({
    where: { id: scopeId },
    select: { costPerHour: true, itemId: true },
  });

  if (scope?.costPerHour) {
    const unitCost = scope.costPerHour;
    await prisma.projectCost.create({
      data: {
        projectId,
        itemId: scope.itemId ?? null,
        costType: "LABOR",
        unitCost,
        quantity: hours,
        amount: unitCost * hours,
        notes: "Auto-populated when time was logged.",
      },
    });
  }

  return NextResponse.json(entry, { status: 201 });
}
