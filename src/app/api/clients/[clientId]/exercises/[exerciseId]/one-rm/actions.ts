import { OneRMPoint } from "@/types/exercise";

export function normalizeByDay(data: OneRMPoint[]): OneRMPoint[] {
  const byDay = new Map<string, number>();

  for (const point of data) {
    if (!point.value || point.value <= 0) continue; // defensive

    const day = point.date; // already YYYY-MM-DD
    const existing = byDay.get(day);

    if (existing == null || point.value > existing) {
      byDay.set(day, point.value);
    }
  }

  return Array.from(byDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({ date, value }));
}
