import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET! });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const { bomId } = await req.json();

  const bom = await prisma.billOfMaterials.findUnique({
    where: { id: bomId, projectId },
    include: { lines: { include: { item: true } } },
  });

  if (!bom) return NextResponse.json({ error: "BOM not found" }, { status: 404 });

  const serviceLines = bom.lines.filter((l) => l.item.type === "INTERNAL_SERVICE");

  let created = 0;
  let skipped = 0;

  for (const line of serviceLines) {
    const existing = await prisma.projectScope.findFirst({
      where: { projectId, itemId: line.itemId },
    });

    if (existing) {
      await prisma.projectScope.update({
        where: { id: existing.id },
        data: {
          bomId: bom.id,
          bomLineId: line.id,
          estimatedHours: line.quantity,
          ratePerHour: line.sellEach ?? line.item.price ?? null,
          costPerHour: line.costEach ?? line.item.cost ?? null,
        },
      });
      skipped++;
      continue;
    }

    await prisma.projectScope.create({
      data: {
        projectId,
        bomId: bom.id,
        bomLineId: line.id,
        itemId: line.itemId,
        name: line.item.description ?? line.item.itemNumber,
        estimatedHours: line.quantity,
        ratePerHour: line.sellEach ?? line.item.price ?? null,
        costPerHour: line.costEach ?? line.item.cost ?? null,
      },
    });
    created++;
  }

  return NextResponse.json({ created, skipped });
}
