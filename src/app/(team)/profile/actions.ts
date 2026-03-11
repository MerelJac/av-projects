"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notFound } from "next/navigation";
export async function addMyBodyMetric(
  weight: number | null,
  bodyFat: number | null,
) {
  const session = await getServerSession(authOptions);
if (!session?.user?.id) return notFound();
  await prisma.bodyMetric.create({
    data: {
      clientId: session.user.id,
      weight,
      bodyFat,
    },
  });
}
