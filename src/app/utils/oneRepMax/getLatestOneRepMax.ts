import { prisma } from "@/lib/prisma";

export async function getLatestOneRepMax(clientId: string, exerciseId: string) {
  const latest = await prisma.exerciseOneRepMax.findFirst({
    where: { clientId, exerciseId },
    orderBy: { recordedAt: "desc" },
  });

  return latest?.oneRepMax ?? null;
}
