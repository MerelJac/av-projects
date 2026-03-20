import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const users = await prisma.user.findMany({
    where: { role: { in: ["TEAM", "ADMIN"] } },
    select: {
      id: true,
      profile: { select: { firstName: true, lastName: true } },
    },
    orderBy: { profile: { firstName: "asc" } },
  });
  return NextResponse.json(users);
}
