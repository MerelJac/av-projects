import { prisma } from "@/lib/prisma";
import { ItemType } from "@prisma/client";
import Papa from "papaparse";

const VALID_TYPES = new Set(Object.values(ItemType));

function parseFloat_(val: unknown): number | null {
  if (val === null || val === undefined || val === "") return null;
  const n = parseFloat(String(val).replace(/[$,]/g, ""));
  return isNaN(n) ? null : n;
}

function parseType(val: unknown): ItemType | null {
  const upper = String(val ?? "").trim().toUpperCase();
  return VALID_TYPES.has(upper as ItemType) ? (upper as ItemType) : null;
}

export async function uploadCSV(file: File) {
  const text = await file.text();
  const { data } = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  });

  const results = { created: 0, updated: 0, skipped: 0, errors: [] as string[] };

  for (const row of data) {
    const itemNumber = row.itemNumber?.trim();
    if (!itemNumber) {
      results.errors.push(`Row missing itemNumber: ${JSON.stringify(row)}`);
      results.skipped++;
      continue;
    }

    const preferredVendor = row.preferred_vendor?.trim();
    const findPreferredVendor = preferredVendor      ? await prisma.vendor.findFirst({ where: { name: preferredVendor } })
      : null;

    const createdVendor = preferredVendor && !findPreferredVendor
      ? await prisma.vendor.create({ data: { name: preferredVendor } })
      : findPreferredVendor;
    const type = parseType(row.type) ?? ItemType.HARDWARE; // fallback default
    const data_ = {
      manufacturer: row.manufacturer?.trim() || null,
      price: parseFloat_(row.price),
      cost: parseFloat_(row.cost),
      type,
      description: row.description?.trim() || null,
      preferredVendorId: createdVendor?.id || null,
    };

    try {
      const existing = await prisma.item.findUnique({ where: { itemNumber } });
      if (existing) {
        await prisma.item.update({ where: { itemNumber }, data: data_ });
        results.updated++;
      } else {
        await prisma.item.create({ data: { itemNumber, ...data_ } });
        results.created++;
      }
    } catch (err) {
      results.errors.push(`${itemNumber}: ${err instanceof Error ? err.message : "unknown error"}`);
      results.skipped++;
    }
  }

  return results;
}