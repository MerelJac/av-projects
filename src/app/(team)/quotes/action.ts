"use server";

import { prisma } from "@/lib/prisma";

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

export async function addSystemToQuote(
  quoteId: string,
  templateId: string
) {
  const template = await prisma.systemTemplate.findUnique({
    where: { id: templateId },
    include: { items: true },
  });

  if (!template) return;

  for (const t of template.items) {
    const item = await prisma.item.findUnique({
      where: { id: t.itemId },
    });

    if (!item) continue;

    await prisma.quoteLine.create({
      data: {
        quoteId,
        itemId: item.id,
        description: item.itemNumber,
        quantity: t.quantity,
        price: item.price ?? 0,
        cost: item.cost ?? 0,
      },
    });
  }
}

export async function convertQuoteToProject(
  quoteId: string
) {
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
  });

  if (!quote) return;

  await prisma.project.create({
    data: {
      name: `Project from Quote`,
      customerId: quote.customerId,
      quoteId,
    },
  });
}
