import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; scopeId: string; entryId: string }> },
) {
  const { entryId } = await params;
  await prisma.projectCost.deleteMany({ where: { timeEntryId: entryId } });
  await prisma.timeEntry.delete({ where: { id: entryId } });
  return new NextResponse(null, { status: 204 });
}