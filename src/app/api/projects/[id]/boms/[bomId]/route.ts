import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; bomId: string }> }
) {
  const { id, bomId } = await params;

  await prisma.bOMLine.deleteMany({ where: { bomId } });

  await prisma.billOfMaterials.delete({
    where: { id: bomId, projectId: id },
  });

  return NextResponse.json({ ok: true });
}