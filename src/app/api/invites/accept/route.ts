import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const { token, password } = await req.json()

  const invite = await prisma.invite.findUnique({
    where: { token },
  })

  if (!invite || invite.accepted || invite.expiresAt < new Date()) {
    return NextResponse.json({ error: "Invalid invite" }, { status: 400 })
  }

  const user = await prisma.user.create({
    data: {
      email: invite.email,
      password, // 🔒 hash later
      role: "TEAM",
      trainerId: invite.trainerId,
    },
  })

  await prisma.invite.update({
    where: { id: invite.id },
    data: { accepted: true },
  })

  return NextResponse.json({ success: true })
}
