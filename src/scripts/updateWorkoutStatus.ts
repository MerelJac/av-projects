// src/scripts/updateWorkoutStatus.ts
// Run with: npx tsx src/scripts/updateWorkoutStatus.ts
import { prisma } from "@/lib/prisma";
import { missedWorkoutToTrainer } from "@/lib/email-templates/missedWorkoutToTrainer";

export async function updateWorkoutStatus() {
  const now = new Date();

  // 👇 Move back one day
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  const startOfYesterday = new Date(yesterday);
  startOfYesterday.setHours(0, 0, 0, 0);

  const endOfYesterday = new Date(yesterday);
  endOfYesterday.setHours(23, 59, 59, 999);

  // 1️⃣ Find workouts scheduled today that were not completed
  const missedWorkouts = await prisma.scheduledWorkout.findMany({
    where: {
      scheduledDate: {
        gte: startOfYesterday,
        lte: endOfYesterday,
      },
      status: {
        notIn: ["COMPLETED"],
      },
    },
    include: {
      client: {
        include: {
          profile: true,
          trainer: {
            include: {
              profile: true,
            },
          },
        },
      },
      workout: true,
    },
  });

  // 2️⃣ Mark them as skipped
  await prisma.scheduledWorkout.updateMany({
    where: {
      id: { in: missedWorkouts.map(w => w.id) },
    },
    data: {
      status: "SKIPPED",
    },
  });

  // 3️⃣ Notify trainers
  for (const workout of missedWorkouts) {
    const client = workout.client;
    const trainer = client.trainer;

    if (!trainer || !trainer.profile || !client.profile) continue;

    await missedWorkoutToTrainer(
      trainer.email,
      trainer.profile.firstName,
      workout.scheduledDate.toDateString(),
      workout.workout.name,
      client.profile.firstName,
    );
  }

  console.log(`✅ Marked ${missedWorkouts.length} workouts as SKIPPED`);
  return {
    skippedCount: missedWorkouts.length,
    workoutIds: missedWorkouts.map(w => w.id),
  };
}


// updateWorkoutStatus().finally(() => prisma.$disconnect());