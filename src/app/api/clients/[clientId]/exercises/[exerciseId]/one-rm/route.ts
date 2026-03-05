// app/api/clients/[clientId]/exercises/[exerciseId]/one-rm/route.ts
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  context: {
    params: Promise<{ clientId: string; exerciseId: string }>;
  }
) {
  const { clientId, exerciseId } = await context.params;

  const rows = await prisma.exerciseOneRepMax.findMany({
    where: {
      clientId,
      exerciseId,
    },
    orderBy: { recordedAt: "asc" },
    select: {
      recordedAt: true,
      oneRepMax: true,
    },
  });
  
  console.log("1RM history rows:", rows.slice(0, 5)); // Log only the first 5 rows for debugging
  return Response.json(
    rows.map((r) => ({
      date: r.recordedAt.toISOString().split("T")[0],
      value: Math.round(r.oneRepMax),
    }))
  );
}
