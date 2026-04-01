"use client";

import { useState } from "react";
import { Download, ChevronLeft, ChevronRight } from "lucide-react";

export type Column = {
  key: string;
  label: string;
  type?: "match-badge" | "currency";
};

type Props = {
  title: string;
  columns: Column[];
  rows: Record<string, unknown>[];
  filename?: string;
  pageSize?: number;
};

const MATCH_STYLES: Record<string, string> = {
  "linked": "bg-green-100 text-green-700",
  "matched-by-name": "bg-blue-100 text-blue-700",
  "matched-by-number": "bg-blue-100 text-blue-700",
  "local-only": "bg-amber-100 text-amber-700",
  "bc-only": "bg-purple-100 text-purple-700",
};

const MATCH_LABELS: Record<string, string> = {
  "linked": "Linked",
  "matched-by-name": "Auto-matched",
  "matched-by-number": "Auto-matched",
  "local-only": "Local only",
  "bc-only": "BC only",
};

export function MatchBadge({ status }: { status: string }) {
  return (
    <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${MATCH_STYLES[status] ?? "bg-gray-100 text-gray-600"}`}>
      {MATCH_LABELS[status] ?? status}
    </span>
  );
}

function toCSV(columns: Column[], rows: Record<string, unknown>[]): string {
  const header = columns.map((c) => `"${c.label}"`).join(",");
  const body = rows.map((row) =>
    columns
      .map((c) => {
        const val = row[c.key];
        if (val === null || val === undefined) return '""';
        return `"${String(val).replace(/"/g, '""')}"`;
      })
      .join(","),
  );
  return [header, ...body].join("\n");
}

function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportTable({ title, columns, rows, filename, pageSize = 50 }: Props) {
  const [page, setPage] = useState(0);

  const totalPages = Math.ceil(rows.length / pageSize);
  const pageRows = rows.slice(page * pageSize, (page + 1) * pageSize);
  const start = page * pageSize + 1;
  const end = Math.min((page + 1) * pageSize, rows.length);

  function handleExport() {
    const csv = toCSV(columns, rows); // always all rows
    downloadCSV(csv, filename ?? `${title.toLowerCase().replace(/\s+/g, "-")}.csv`);
  }

  return (
    <div className="bg-white border border-[#E5E3DE] rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-[#F0EEE9] flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-[#111]">{title}</h2>
          <p className="text-xs text-[#999] mt-0.5">{rows.length} records</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 border border-[#E5E3DE] text-[#666] rounded-lg hover:border-[#111] hover:text-[#111] transition-colors"
        >
          <Download size={12} />
          Export CSV
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#F0EEE9] text-[10px] font-semibold uppercase tracking-widest text-[#999]">
              {columns.map((col) => (
                <th key={col.key} className="text-left px-4 py-3 first:pl-6 last:pr-6">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F7F6F3]">
            {pageRows.map((row, i) => (
              <tr key={i} className="hover:bg-[#FAFAF9] transition-colors">
                {columns.map((col) => {
                  const val = row[col.key];
                  let cell: React.ReactNode;
                  if (col.type === "match-badge") {
                    cell = <MatchBadge status={val as string} />;
                  } else if (col.type === "currency") {
                    cell = val != null
                      ? `$${(val as number).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : <span className="text-[#ccc]">—</span>;
                  } else {
                    cell = val != null ? String(val) : <span className="text-[#ccc]">—</span>;
                  }
                  return (
                    <td key={col.key} className="px-4 py-3 first:pl-6 last:pr-6">
                      {cell}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="px-6 py-3 border-t border-[#F0EEE9] flex items-center justify-between">
          <p className="text-xs text-[#999]">
            {start}–{end} of {rows.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 0}
              className="p-1 rounded-lg text-[#999] hover:text-[#111] hover:bg-[#F7F6F3] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs text-[#666] px-2">
              Page {page + 1} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages - 1}
              className="p-1 rounded-lg text-[#999] hover:text-[#111] hover:bg-[#F7F6F3] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
