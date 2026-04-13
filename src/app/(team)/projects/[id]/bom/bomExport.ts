import { BOMLine } from "@/types/bom";

function escapeCell(value: string | number | null | undefined): string {
  const str = value == null ? "" : String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportBomToCsv(
  lines: BOMLine[],
  bomName: string,
  projectName: string,
): void {
  const headers = [
    "Section",
    "Part Number",
    "Manufacturer",
    "Description",
    "Category",
    "Type",
    "Qty",
    "Unit",
    "Cost Each",
    "Sell Each",
    "Margin %",
    "Total Cost",
    "Total Sell",
    "Notes",
  ];

  const rows = lines.map((l) => {
    const cost = l.costEach ?? l.item.cost ?? 0;
    const sell = l.sellEach ?? 0;
    const qty = l.quantity ?? 1;
    return [
      l.section ?? "General",
      l.item.itemNumber,
      l.item.manufacturer ?? "",
      l.item.description ?? "",
      l.item.category ?? "",
      l.item.type,
      qty,
      l.unit ?? "each",
      cost.toFixed(2),
      sell.toFixed(2),
      l.marginPct != null ? l.marginPct.toFixed(2) : "",
      (cost * qty).toFixed(2),
      (sell * qty).toFixed(2),
      l.notes ?? "",
    ];
  });

  const csv = [headers, ...rows]
    .map((row) => row.map(escapeCell).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${projectName} - ${bomName}.csv`.replace(/[/\\?%*:|"<>]/g, "-");
  a.click();
  URL.revokeObjectURL(url);
}
