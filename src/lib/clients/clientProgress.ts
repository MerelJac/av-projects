import { prisma } from "@/lib/prisma";

function normalizeOneRMByDay(
  rows: { recordedAt: Date; oneRepMax: number }[],
): { date: string; value: number }[] {
  const byDay = new Map<string, number>();

  for (const row of rows) {
    if (!row.oneRepMax || row.oneRepMax <= 0) continue;

    const day = row.recordedAt.toISOString().split("T")[0];
    const existing = byDay.get(day);

    if (existing == null || row.oneRepMax > existing) {
      byDay.set(day, row.oneRepMax);
    }
  }

  return Array.from(byDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({ date, value }));
}

export async function getClientProgressSummary(clientId: string) {
  // Pull all recorded 1RM values
  const logs = await prisma.exerciseOneRepMax.findMany({
    where: { clientId },
    include: {
      exercise: true,
    },
    orderBy: {
      recordedAt: "asc",
    },
  });

  // Group by exercise
  const byExercise = new Map<
    string,
    { exerciseId: string; exerciseName: string; oneRepMaxes: number[] }
  >();

  for (const log of logs) {
    const key = log.exerciseId;

    if (!byExercise.has(key)) {
      byExercise.set(key, {
        exerciseId: log.exerciseId,
        exerciseName: log.exercise.name,
        oneRepMaxes: [],
      });
    }

    byExercise.get(key)!.oneRepMaxes.push(log.oneRepMax);
  }

  // Build progress deltas
  const strength = Array.from(byExercise.values())
    .map(({ exerciseId, exerciseName, oneRepMaxes }) => {
      if (oneRepMaxes.length < 2) return null;

      // Rebuild rows so we can normalize by day
      const rows = oneRepMaxes
        .map((value, i) => ({
          recordedAt: logs.filter((l) => l.exerciseId === exerciseId)[i]
            ?.recordedAt,
          oneRepMax: value,
        }))
        .filter((r) => r.recordedAt);

      const normalized = normalizeOneRMByDay(
        rows as { recordedAt: Date; oneRepMax: number }[],
      );

      if (normalized.length < 2) return null;

      const previous = normalized[normalized.length - 2].value;
      const current = normalized[normalized.length - 1].value;

      return {
        exerciseId,
        exerciseName,
        previous1RM: Math.round(previous),
        current1RM: Math.round(current),
        delta: Math.round(current - previous),
      };
    })
    .filter(
      (
        v,
      ): v is {
        exerciseId: string;
        exerciseName: string;
        previous1RM: number;
        current1RM: number;
        delta: number;
      } => v !== null,
    )
    .slice(0, 5);

  // ----------------------------
  // BODY CHECK-INS
  // ----------------------------

  const checkIns = await prisma.bodyMetric.findMany({
    where: { clientId },
    orderBy: { recordedAt: "desc" },
    take: 2,
  });

  const weight =
    checkIns.length === 2 && checkIns[0].weight && checkIns[1].weight
      ? {
          current: checkIns[0].weight,
          previous: checkIns[1].weight,
        }
      : null;

  const bodyFat =
    checkIns.length === 2 && checkIns[0].bodyFat && checkIns[1].bodyFat
      ? {
          current: checkIns[0].bodyFat,
          previous: checkIns[1].bodyFat,
        }
      : null;

  return {
    strength,
    weight,
    bodyFat,
  };
}
