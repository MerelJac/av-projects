import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; bomId: string }> },
) {
  const { id, bomId } = await params;
  const { lines, tariff } = await req.json();

  if (!Array.isArray(lines)) {
    return NextResponse.json(
      { error: "Lines must be an array" },
      { status: 400 },
    );
  }

  const bom = await prisma.billOfMaterials.findUnique({
    where: { id: bomId },
  });

  if (!bom || bom.projectId !== id) {
    return NextResponse.json({ error: "BOM not found" }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.bOMLine.deleteMany({ where: { bomId } }),
    prisma.bOMLine.createMany({
      data: lines.map(
        (l: {
          itemId: string;
          quantity: number;
          notes?: string;
          section?: string;
          costEach?: number | null;
          sellEach?: number | null;
          sortOrder?: number;
        }) => ({
          bomId,
          itemId: l.itemId,
          quantity: l.quantity ?? 1,
          notes: l.notes ?? null,
          section: l.section ?? "General",
          costEach: l.costEach ?? null,
          sellEach: l.sellEach ?? null,
          sortOrder: l.sortOrder ?? 0,
        }),
      ),
    }),
  ]);
  return NextResponse.json({ ok: true });
}
