import { BOMLine } from "@/types/bom";

export function calcBOMTotals(
  lines: BOMLine[],
  customerPrices: Record<string, number>,
  tariff: number = 0,
) {
  const effectivePrice = (itemId: string, standardPrice: number | null) =>
    customerPrices[itemId] ?? standardPrice;

  const hardwareLines = lines.filter((l) => l.item.type !== "SERVICE");
  const serviceLines = lines.filter((l) => l.item.type === "SERVICE");

  const totalHardwareSell = hardwareLines.reduce(
    (sum, l) =>
      sum + (l.sellEach ?? effectivePrice(l.itemId, l.item.price) ?? 0) * l.quantity,
    0,
  );
  const totalServiceSell = serviceLines.reduce(
    (sum, l) =>
      sum + (l.sellEach ?? effectivePrice(l.itemId, l.item.price) ?? 0) * l.quantity,
    0,
  );
  const totalCostAll = lines.reduce(
    (sum, l) => sum + (l.costEach ?? l.item.cost ?? 0) * l.quantity,
    0,
  );
  const grandTotal = totalHardwareSell + totalServiceSell + tariff;
  const gm = grandTotal > 0 ? ((grandTotal - totalCostAll) / grandTotal) * 100 : 0;

  return { totalHardwareSell, totalServiceSell, totalCostAll, grandTotal, gm };
}