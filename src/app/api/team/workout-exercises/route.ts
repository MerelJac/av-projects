import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { Prescribed } from "@/types/prescribed";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const sectionId = String(formData.get("sectionId"));
  const exerciseId = String(formData.get("exerciseId"));

  const exercise = await prisma.exercise.findUnique({
    where: { id: exerciseId },
  });

  if (!exercise) {
    return NextResponse.json({ error: "Invalid exercise" }, { status: 400 });
  }

  // Build prescribed JSON based on exercise type
  let prescribed: Prescribed;

  switch (exercise.type) {
    case "STRENGTH":
      prescribed = {
        kind: "strength",
        sets: Number(formData.get("sets")),
        reps: Number(formData.get("reps")),
        weight: formData.get("weight") ? Number(formData.get("weight")) : null,
      };
      break;
    case "HYBRID":
      prescribed = {
        kind: "hybrid",
        sets: Number(formData.get("sets")),
        reps: Number(formData.get("reps")),
        weight: formData.get("weight") ? Number(formData.get("weight")) : null,
        duration:formData.get("duration") ? Number(formData.get("weight")) : null,
      };
      break;

    case "BODYWEIGHT":
      prescribed = {
        kind: "bodyweight",
        sets: Number(formData.get("sets")),
        reps: Number(formData.get("reps")),
      };
      break;

    case "TIMED":
      prescribed = {
        kind: "timed",
        duration: Number(formData.get("duration")),
      };
      break;

    case "CORE":
      prescribed = {
        kind: "core",
        sets: Number(formData.get("sets")),
        reps: Number(formData.get("reps")),
        weight: formData.get("weight") ? Number(formData.get("weight")) : null,
        duration: Number(formData.get("duration")),
      };
      break;

    case "MOBILITY":
      prescribed = {
        kind: "mobility",
        sets: Number(formData.get("sets")),
        reps: Number(formData.get("reps")),
        weight: formData.get("weight") ? Number(formData.get("weight")) : null,
        duration: Number(formData.get("duration")),
      };
      break;

    default:
      return NextResponse.json(
        { error: "Unsupported exercise type" },
        { status: 400 },
      );
  }

  const order = await prisma.workoutExercise.count({
    where: { sectionId },
  });

  await prisma.workoutExercise.create({
    data: {
      sectionId,
      exerciseId,
      order,
      prescribed,
    },
  });

  return NextResponse.redirect(req.headers.get("referer")!);
}
