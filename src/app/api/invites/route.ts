import { NextResponse, NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { randomUUID } from "crypto"
import { getToken } from "next-auth/jwt";

export async function POST(req: Request) {
  const token = await getToken({
    req: req as NextRequest,
    secret: process.env.NEXTAUTH_SECRET!,
  })

if (!token || (token.role !== "TRAINER" && token.role !== "ADMIN")){
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { email } = await req.json()

  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 })
  }

  const invite = await prisma.invite.create({
    data: {
      email,
      trainerId: token.id,
      token: randomUUID(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days
    },
  })

  // 🔜 Later: send email
  return NextResponse.json({
    inviteLink: `${process.env.NEXT_PUBLIC_APP_URL}/invite/${invite.token}`,
  })
}
