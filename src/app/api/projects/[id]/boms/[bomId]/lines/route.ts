import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; bomId: string } }
) {
  const { lines } = await req.json();

  if (!Array.isArray(lines)) {
    return NextResponse.json({ error: "Lines must be an array" }, { status: 400 });
  }

  const bom = await prisma.billOfMaterials.findUnique({
    where: { id: params.bomId },
  });

  if (!bom || bom.projectId !== params.id) {
    return NextResponse.json({ error: "BOM not found" }, { status: 404 });
  }

  // Replace all lines atomically
  await prisma.$transaction([
    prisma.bOMLine.deleteMany({ where: { bomId: params.bomId } }),
    prisma.bOMLine.createMany({
      data: lines.map(
        (l: { itemId: string; quantity: number; notes?: string; sortOrder?: number }, i: number) => ({
          bomId: params.bomId,
          itemId: l.itemId,
          quantity: l.quantity ?? 1,
          notes: l.notes ?? null,
          sortOrder: l.sortOrder ?? i,
        })
      ),
    }),
  ]);

  return NextResponse.json({ ok: true });
}
