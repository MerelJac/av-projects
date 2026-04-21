import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import { randomBytes } from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { sendWelcomeEmail } from "@/lib/email-templates/welcomeEmail";

export async function GET() {
  const invites = await prisma.invite.findMany({
    where: { accepted: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
    select: { id: true, email: true, role: true, token: true, createdAt: true, expiresAt: true },
  });
  return NextResponse.json(invites);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { email, role, firstName, lastName, phone } = await req.json();

  if (!email?.trim() || !role || !firstName?.trim() || !lastName?.trim()) {
    return NextResponse.json({ error: "Email, role, first name, and last name are required" }, { status: 400 });
  }

  if (!Object.values(Role).includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (existing) {
    return NextResponse.json({ error: "A user with that email already exists" }, { status: 409 });
  }

  // Create user + profile immediately; invite link lets them set their password
  const tempPassword = await bcrypt.hash(randomBytes(32).toString("hex"), 10);

  const [user, invite] = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        email: email.trim().toLowerCase(),
        password: tempPassword,
        role: role as Role,
        profile: {
          create: {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            phone: phone?.trim() || null,
          },
        },
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        profile: { select: { firstName: true, lastName: true, phone: true } },
      },
    });

    const newInvite = await tx.invite.create({
      data: {
        email: email.trim().toLowerCase(),
        role: role as Role,
        token: randomUUID(),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days
      },
      select: { id: true, email: true, role: true, token: true, createdAt: true, expiresAt: true },
    });

    
    
    return [newUser, newInvite];
  });

  // send welcome email
  await sendWelcomeEmail(email)

  return NextResponse.json({
    user,
    invite,
    inviteLink: `${process.env.NEXT_PUBLIC_APP_URL}/invite/${invite.token}`,
  }, { status: 201 });
}
