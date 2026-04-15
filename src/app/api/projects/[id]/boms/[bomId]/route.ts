import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; bomId: string }> }
) {
  const { id, bomId } = await params;
  const { name } = await req.json();

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const bom = await prisma.billOfMaterials.update({
    where: { id: bomId, projectId: id },
    data: { name: name.trim() },
  });

  return NextResponse.json(bom);
}

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