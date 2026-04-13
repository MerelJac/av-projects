"use client";
import { Download } from "lucide-react";
import { BOMLine } from "@/types/bom";
import { exportBomToCsv } from "./bomExport";

export default function BomExportButton({
  lines,
  bomName,
  projectName,
}: {
  lines: BOMLine[];
  bomName: string;
  projectName: string;
}) {
  return (
    <button
      onClick={() => exportBomToCsv(lines, bomName, projectName)}
      disabled={lines.length === 0}
      className="flex items-center justify-end gap-2 bg-white border border-[#E5E3DE] text-[#111] text-sm font-semibold px-4 py-2 rounded-xl hover:bg-[#F7F6F3] disabled:opacity-40 transition-colors"
      title="Export BOM to CSV"
    >
      <Download size={14} />
      Export CSV
    </button>
  );
}
