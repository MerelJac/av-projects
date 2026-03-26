import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ bomId: string }> },
) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET! });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { bomId } = await params;
  const { targetProjectId } = await req.json();

  if (!targetProjectId) {
    return NextResponse.json({ error: "targetProjectId is required" }, { status: 400 });
  }

  const source = await prisma.billOfMaterials.findUnique({
    where: { id: bomId },
    include: { lines: true },
  });

  if (!source) return NextResponse.json({ error: "BOM not found" }, { status: 404 });

  const targetProject = await prisma.project.findUnique({ where: { id: targetProjectId } });
  if (!targetProject) {
    return NextResponse.json({ error: "Target project not found" }, { status: 404 });
  }

  const newBom = await prisma.billOfMaterials.create({
    data: {
      name: source.name,
      projectId: targetProjectId,
      lines: {
        create: source.lines.map((l) => ({
          itemId: l.itemId,
          quantity: l.quantity,
          notes: l.notes,
          section: l.section,
          costEach: l.costEach,
          sellEach: l.sellEach,
          sortOrder: l.sortOrder,
        })),
      },
    },
  });

  return NextResponse.json({ bomId: newBom.id, projectId: targetProjectId });
}
