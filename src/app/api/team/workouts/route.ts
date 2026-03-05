import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const formData = await req.formData()
  const programId = String(formData.get("programId"))

  // determine order
  const order = await prisma.workoutTemplate.count({
    where: { programId },
  })

  const workout = await prisma.workoutTemplate.create({
    data: {
      programId,
      name: `Workout ${order + 1}`,
      order,
    },
  })

  return NextResponse.redirect(
    new URL(`/trainer/programs/${programId}`, req.url)
  )
}
