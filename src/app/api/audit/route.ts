import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const documentType = searchParams.get("documentType");
  const documentId = searchParams.get("documentId");

  if (!documentType || !documentId) {
    return NextResponse.json({ error: "documentType and documentId are required" }, { status: 400 });
  }

  const logs = await prisma.auditLog.findMany({
    where: { documentType, documentId },
    include: {
      user: {
        select: {
          id: true,
          profile: { select: { firstName: true, lastName: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(logs);
}
