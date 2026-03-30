import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const options = await prisma.salesperson.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json(options);
}

export async function POST(req: NextRequest) {
  const { field, value } = await req.json();
  if (!field || !value?.trim()) {
    return NextResponse.json({ error: "field and value required" }, { status: 400 });
  }
  const validFields = ["salesperson"];
  if (!validFields.includes(field)) {
    return NextResponse.json({ error: "Invalid field" }, { status: 400 });
  }
  try {
    const option = await prisma.salesperson.create({
      data: { name: value.trim() },
    });
    return NextResponse.json(option);
  } catch {
    return NextResponse.json({ error: "Already exists" }, { status: 409 });
  }
}
