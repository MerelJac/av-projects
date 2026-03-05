import { prisma } from "@/lib/prisma"
import Papa from "papaparse"

export async function uploadCSV(file: File) {
  const text = await file.text()

  const parsed = Papa.parse(text, {
    header: true,
  })

  for (const row of parsed.data as any[]) {
    await prisma.item.create({
      data: {
        itemNumber: row.item_no,
        manufacturer: row.manufacturer,
        price: Number(row.price),
        cost: Number(row.cost),
      },
    })
  }
}