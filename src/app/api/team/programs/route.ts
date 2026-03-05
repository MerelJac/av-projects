import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
console.log("SESSION USER:", session?.user ?? 'NA')

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { name, notes } = await req.json()

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 })
  }

  const program = await prisma.program.create({
    data: {
      name,
      notes,
      trainer: {
        connect: { id: session.user.id },
      },
    },
  })

  return NextResponse.json(program, { status: 201 })
}
