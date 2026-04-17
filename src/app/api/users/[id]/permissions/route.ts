import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Permission } from "@prisma/client";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { permissions } = await req.json();

  if (!Array.isArray(permissions) || permissions.some((p) => !(p in Permission))) {
    return NextResponse.json({ error: "Invalid permissions" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id },
    data: { permissions },
    select: { id: true, permissions: true },
  });

  return NextResponse.json(user);
}
