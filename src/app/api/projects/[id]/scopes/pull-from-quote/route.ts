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
  const { quoteId } = await req.json();

  const quote = await prisma.quote.findUnique({
    where: { id: quoteId, status: "ACCEPTED" },
    include: { lines: { include: { item: true } } },
  });

  if (!quote) return NextResponse.json({ error: "Quote not found" }, { status: 404 });

  const serviceLines = quote.lines.filter((l) => l.item?.type === "INTERNAL_SERVICE");

  let created = 0;
  let skipped = 0;

  for (const line of serviceLines) {
    const existing = line.itemId
      ? await prisma.projectScope.findFirst({
          where: { projectId, itemId: line.itemId },
        })
      : null;

    if (existing) { skipped++; continue; }

    await prisma.projectScope.create({
      data: {
        projectId,
        itemId: line.itemId ?? null,
        name: line.description,
        estimatedHours: line.quantity,
      },
    });
    created++;
  }

  return NextResponse.json({ created, skipped });
}