"use server";
// src/app/(team)/quotes/action.ts
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function addItemToQuote(
  quoteId: string,
  itemId: string
) {
  const item = await prisma.item.findUnique({
    where: { id: itemId },
  });

  if (!item) return;

  await prisma.quoteLine.create({
    data: {
      quoteId,
      itemId,
      description: item.itemNumber,
      quantity: 1,
      price: item.price ?? 0,
      cost: item.cost ?? 0,
    },
  });
}


export async function createQuote(formData: FormData) {
  const customerId = formData.get("customerId") as string;

  if (!customerId) {
    throw new Error("Customer required");
  }

  const quote = await prisma.quote.create({
    data: {
      customerId,
      status: "DRAFT",
    },
  });

  redirect(`/quotes/${quote.id}/builder`);
}