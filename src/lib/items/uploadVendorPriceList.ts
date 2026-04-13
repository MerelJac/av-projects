import { prisma } from "@/lib/prisma";
import Papa from "papaparse";

function parseFloat_(val: unknown): number | null {
  if (val === null || val === undefined || val === "") return null;
  const n = parseFloat(String(val).replace(/[$,]/g, ""));
  return isNaN(n) ? null : n;
}

function parseInt_(val: unknown): number | null {
  if (val === null || val === undefined || val === "") return null;
  const n = parseInt(String(val), 10);
  return isNaN(n) ? null : n;
}

export async function uploadVendorPriceList(file: File, vendorId: string) {
  const text = await file.text();
  const { data } = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  });

  const results = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [] as { row: number; itemNumber: string; reason: string }[],
  };

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowNum = i + 2; // 1-indexed + header row

    const itemNumber = row.itemNumber?.trim() || row.item_number?.trim() || row.sku?.trim();
    if (!itemNumber) {
      results.errors.push({ row: rowNum, itemNumber: "—", reason: "Missing itemNumber / sku" });
      results.skipped++;
      continue;
    }

    const cost = parseFloat_(row.cost ?? row.price ?? row.unitCost);
    if (cost === null || cost <= 0) {
      results.errors.push({ row: rowNum, itemNumber, reason: "Missing or invalid cost" });
      results.skipped++;
      continue;
    }

    const item = await prisma.item.findUnique({ where: { itemNumber } });
    if (!item) {
      results.errors.push({ row: rowNum, itemNumber, reason: "No matching item found" });
      results.skipped++;
      continue;
    }

    try {
      const existing = await prisma.vendorItemPrice.findUnique({
        where: { vendorId_itemId: { vendorId, itemId: item.id } },
      });

      const priceData = {
        cost,
        leadTimeDays: parseInt_(row.leadTimeDays ?? row.lead_time ?? row.leadTime),
        notes: row.notes?.trim() || null,
      };

      if (existing) {
        await prisma.vendorItemPrice.update({
          where: { vendorId_itemId: { vendorId, itemId: item.id } },
          data: priceData,
        });
        results.updated++;
      } else {
        await prisma.vendorItemPrice.create({
          data: { vendorId, itemId: item.id, ...priceData },
        });
        results.created++;
      }
    } catch (err) {
      results.errors.push({
        row: rowNum,
        itemNumber,
        reason: err instanceof Error ? err.message : "Unknown error",
      });
      results.skipped++;
    }
  }

  return results;
}