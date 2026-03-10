import { prisma } from "@/lib/prisma";
import { NoteDocumentType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const documentType = searchParams.get("documentType") as NoteDocumentType | null;
  const documentId = searchParams.get("documentId");

  if (!documentType || !documentId) {
    return NextResponse.json({ error: "documentType and documentId required" }, { status: 400 });
  }

  const notes = await prisma.note.findMany({
    where: { documentType, documentId },
    include: { user: { include: { profile: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(notes);
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET! });
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { documentType, documentId, content } = await req.json();

  if (!documentType || !documentId || !content?.trim()) {
    return NextResponse.json({ error: "documentType, documentId, and content required" }, { status: 400 });
  }

  const note = await prisma.note.create({
    data: {
      documentType,
      documentId,
      content: content.trim(),
      userId: token.id as string,
    },
    include: { user: { include: { profile: true } } },
  });

  return NextResponse.json(note, { status: 201 });
}
