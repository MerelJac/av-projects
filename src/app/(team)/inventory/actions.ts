"use server"

import { prisma } from "@/lib/prisma"

export async function createItem(data: any) {
  await prisma.item.create({
    data: {
      itemNumber: data.itemNumber,
      manufacturer: data.manufacturer,
      price: Number(data.price),
      cost: Number(data.cost),
      type: data.type,
    },
  })
}