import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ItemType } from "@prisma/client";

const VALID_TYPES = Object.values(ItemType);

function parseBoolean(val: string | undefined): boolean {
  if (!val) return true;
  return !["false", "0", "no", "n", "inactive"].includes(val.trim().toLowerCase());
}

function parseFloat_(val: string | undefined): number | null {
  if (!val || val.trim() === "") return null;
  const n = parseFloat(val.replace(/[$,]/g, ""));
  return isNaN(n) ? null : n;
}

function normalizeType(val: string): ItemType | null {
  const upper = val.trim().toUpperCase() as ItemType;
  return VALID_TYPES.includes(upper) ? upper : null;
}

export async function POST(req: NextRequest) {
  try {
    const { rows } = await req.json() as { rows: Record<string, string>[] };

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "No rows provided" }, { status: 400 });
    }

    const results = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [] as { row: number; reason: string }[],
    };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const itemNumber = row.itemNumber?.trim();

      if (!itemNumber) {
        results.errors.push({ row: i + 2, reason: "Missing itemNumber" });
        results.skipped++;
        continue;
      }

      const type = normalizeType(row.type) ?? ItemType.HARDWARE; // default to HARDWARE if type is missing or invalid
      if (!type) {
        results.errors.push({
          row: i + 2,
          reason: `Invalid type "${row.type}". Must be one of: ${VALID_TYPES.join(", ")}`,
        });
        results.skipped++;
        continue;
      }

      const data = {
        manufacturer: row.manufacturer?.trim() || null,
        type,
        description: row.description?.trim() || null,
        cost: parseFloat_(row.cost),
        price: parseFloat_(row.price),
        category: row.category?.trim() || null,
        active: parseBoolean(row.active),
      };

      try {
        const existing = await prisma.item.findUnique({ where: { itemNumber } });
        if (existing) {
          await prisma.item.update({ where: { itemNumber }, data });
          results.updated++;
        } else {
          await prisma.item.create({ data: { itemNumber, ...data } });
          results.created++;
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        results.errors.push({ row: i + 2, reason: message });
        results.skipped++;
      }
    }

    return NextResponse.json(results);
  } catch {
    return NextResponse.json({ error: "Failed to process import" }, { status: 500 });
  }
}