"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createBundle(formData: FormData) {
  const quoteId = formData.get("quoteId") as string;
  const name = formData.get("name") as string;

  if (!name) throw new Error("Bundle name required");

  await prisma.quoteBundle.create({
    data: {
      quoteId,
      name,
      showToCustomer: true,
    },
  });

  revalidatePath(`/quotes/${quoteId}/builder`);
}

export async function deleteBundle(bundleId: string, quoteId: string) {
  await prisma.quoteLine.deleteMany({
    where: { bundleId },
  });

  await prisma.quoteBundle.delete({
    where: { id: bundleId },
  });

  revalidatePath(`/quotes/${quoteId}/builder`);
}

export async function createLine(formData: FormData) {
  const quoteId = formData.get("quoteId") as string;
  const itemId = formData.get("itemId") as string;
  const bundleId = formData.get("bundleId") as string | null;

  const item = await prisma.item.findUnique({
    where: { id: itemId },
  });

  if (!item) throw new Error("Item not found");

  await prisma.quoteLine.create({
    data: {
      quoteId,
      bundleId: bundleId || null,
      itemId,
      description: item.itemNumber,
      quantity: 1,
      price: item.price || 0,
      cost: item.cost || 0,
    },
  });

  revalidatePath(`/quotes/${quoteId}/builder`);
}

export async function deleteLine(lineId: string, quoteId: string) {
  await prisma.quoteLine.delete({
    where: { id: lineId },
  });

  revalidatePath(`/quotes/${quoteId}/builder`);
}