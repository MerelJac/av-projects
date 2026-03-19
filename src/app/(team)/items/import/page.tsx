"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Upload, AlertCircle, CheckCircle2,  FileText, ChevronDown } from "lucide-react";

const ITEM_FIELDS = [
  { key: "itemNumber", label: "Item Number", required: true },
  { key: "manufacturer", label: "Manufacturer", required: false },
  { key: "type", label: "Type", required: true, hint: "HARDWARE, SOFTWARE, SUBSCRIPTION, SERVICE" },
  { key: "description", label: "Description", required: false },
  { key: "unit", label: "Unit", required: false },
  { key: "cost", label: "Cost", required: false },
  { key: "price", label: "Price", required: false },
  { key: "category", label: "Category", required: false },
  { key: "active", label: "Active", required: false, hint: "true/false, defaults to true" },
];

function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return { headers: [], rows: [] };

  const parseRow = (line: string) => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (line[i] === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += line[i];
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseRow(lines[0]);
  const rows = lines.slice(1).filter(l => l.trim()).map(line => {
    const values = parseRow(line);
    return headers.reduce((acc, h, i) => ({ ...acc, [h]: values[i] ?? "" }), {} as Record<string, string>);
  });

  return { headers, rows };
}

function autoMap(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  const normalize = (s: string) => s.toLowerCase().replace(/[\s_-]/g, "");
  const aliases: Record<string, string[]> = {
    itemNumber: ["itemnumber", "item#", "itemno", "sku", "partnumber", "partno"],
    manufacturer: ["manufacturer", "mfr", "vendor", "brand", "make"],
    type: ["type", "itemtype", "category_type"],
    description: ["description", "desc", "notes", "summary"],
    cost: ["cost", "unitcost", "purchaseprice", "buyprice"],
    price: ["price", "unitprice", "sellprice", "salesprice", "listprice"],
    category: ["category", "cat", "group", "productgroup"],
    active: ["active", "status", "enabled", "isactive"],
    unit: ["unit", "uom", "measure", "measurement"],
  };

  for (const [field, aliasList] of Object.entries(aliases)) {
    const match = headers.find(h => aliasList.includes(normalize(h)));
    if (match) mapping[field] = match;
  }
  return mapping;
}

type ImportResult = {
  created: number;
  updated: number;
  skipped: number;
  errors: { row: number; reason: string }[];
};

export default function ImportItemsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [dragOver, setDragOver] = useState(false);
  const [step, setStep] = useState<"upload" | "map" | "preview" | "done">("upload");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((f: File) => {
    if (!f.name.endsWith(".csv")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { headers, rows } = parseCSV(text);
      setFile(f);
      setHeaders(headers);
      setRows(rows);
      setMapping(autoMap(headers));
      setStep("map");
    };
    reader.readAsText(f);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) processFile(f);
  }, [processFile]);

  const mappedRows = rows.map(row =>
    Object.fromEntries(
      Object.entries(mapping)
        .filter(([, col]) => col)
        .map(([field, col]) => [field, row[col] ?? ""])
    )
  );

  const canImport = ITEM_FIELDS.filter(f => f.required).every(f => mapping[f.key]);

  async function handleImport() {
    setLoading(true);
    try {
      const res = await fetch("/api/items/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: mappedRows }),
      });
      const data = await res.json();
      setResult(data);
      setStep("done");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setFile(null); setHeaders([]); setRows([]); setMapping({});
    setStep("upload"); setResult(null);
  }

  return (
    <div className="min-h-screen bg-[#F7F6F3]">
      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link
            href="/items"
            className="flex items-center gap-1.5 text-sm text-[#666] hover:text-[#111] transition-colors"
          >
            <ArrowLeft size={14} />
            Items
          </Link>
          <span className="text-[#ccc]">/</span>
          <span className="text-sm text-[#111] font-semibold">Import CSV</span>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#111] tracking-tight">Import Items</h1>
          <p className="text-sm text-[#888] mt-1">
            Upload a CSV file to bulk create or update items. Existing items (matched by Item Number) will be updated.
          </p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 mb-8">
          {["upload", "map", "preview", "done"].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold transition-colors ${
                step === s ? "bg-[#111] text-white" :
                ["upload", "map", "preview", "done"].indexOf(step) > i ? "bg-green-500 text-white" :
                "bg-[#E5E3DE] text-[#999]"
              }`}>
                {["upload", "map", "preview", "done"].indexOf(step) > i ? "✓" : i + 1}
              </div>
              <span className={`text-xs font-medium capitalize ${step === s ? "text-[#111]" : "text-[#aaa]"}`}>
                {s}
              </span>
              {i < 3 && <div className="w-6 h-px bg-[#E5E3DE] mx-1" />}
            </div>
          ))}
        </div>

        {/* Step: Upload */}
        {step === "upload" && (
          <div
            className={`border-2 border-dashed rounded-2xl p-16 text-center transition-colors cursor-pointer ${
              dragOver ? "border-[#111] bg-[#F0EEE9]" : "border-[#DDD] bg-white hover:border-[#bbb]"
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); }}
            />
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-[#F0EEE9] rounded-xl flex items-center justify-center">
                <Upload size={20} className="text-[#888]" />
              </div>
            </div>
            <p className="text-sm font-semibold text-[#111] mb-1">Drop a CSV file here, or click to browse</p>
            <p className="text-xs text-[#aaa]">Required columns: itemNumber, type</p>
          </div>
        )}

        {/* Step: Map */}
        {step === "map" && (
          <div className="space-y-4">
            <div className="bg-white border border-[#E5E3DE] rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#F0EEE9] flex items-center gap-3">
                <FileText size={14} className="text-[#888]" />
                <span className="text-sm font-semibold text-[#111]">{file?.name}</span>
                <span className="text-xs text-[#aaa]">{rows.length} rows detected</span>
              </div>

              <div className="p-5 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#999] mb-4">Map CSV Columns</p>
                {ITEM_FIELDS.map(field => (
                  <div key={field.key} className="flex items-center gap-4">
                    <div className="w-36 shrink-0">
                      <span className="text-sm font-medium text-[#333]">{field.label}</span>
                      {field.required && <span className="text-red-400 ml-1 text-xs">*</span>}
                      {field.hint && <p className="text-[10px] text-[#aaa] mt-0.5">{field.hint}</p>}
                    </div>
                    <div className="relative flex-1">
                      <select
                        value={mapping[field.key] ?? ""}
                        onChange={(e) => setMapping(m => ({ ...m, [field.key]: e.target.value }))}
                        className="w-full appearance-none text-sm bg-[#F7F6F3] border border-[#E5E3DE] rounded-lg px-3 py-2 pr-8 text-[#111] focus:outline-none focus:border-[#999]"
                      >
                        <option value="">— skip —</option>
                        {headers.map(h => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                      <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#999] pointer-events-none" />
                    </div>
                    {mapping[field.key] ? (
                      <CheckCircle2 size={14} className="text-green-500 shrink-0" />
                    ) : (
                      <div className="w-3.5 shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between">
              <button onClick={reset} className="text-sm text-[#888] hover:text-[#111] transition-colors">
                ← Start over
              </button>
              <button
                onClick={() => setStep("preview")}
                disabled={!canImport}
                className="text-sm font-semibold bg-[#111] text-white px-5 py-2 rounded-xl hover:bg-[#333] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Preview Import →
              </button>
            </div>
          </div>
        )}

        {/* Step: Preview */}
        {step === "preview" && (
          <div className="space-y-4">
            <div className="bg-white border border-[#E5E3DE] rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#F0EEE9]">
                <p className="text-sm font-semibold text-[#111]">Preview — first 5 rows</p>
                <p className="text-xs text-[#aaa] mt-0.5">{rows.length} total rows will be imported</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#F0EEE9]">
                      {Object.keys(mappedRows[0] ?? {}).map(key => (
                        <th key={key} className="text-left text-[10px] font-semibold uppercase tracking-widest text-[#999] px-4 py-3">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {mappedRows.slice(0, 5).map((row, i) => (
                      <tr key={i} className="border-b border-[#F7F6F3] last:border-0">
                        {Object.values(row).map((val, j) => (
                          <td key={j} className="px-4 py-2.5 text-sm text-[#444] font-mono">
                            {val || <span className="text-[#ccc]">—</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-between">
              <button onClick={() => setStep("map")} className="text-sm text-[#888] hover:text-[#111] transition-colors">
                ← Back to mapping
              </button>
              <button
                onClick={handleImport}
                disabled={loading}
                className="text-sm font-semibold bg-[#111] text-white px-5 py-2 rounded-xl hover:bg-[#333] transition-colors disabled:opacity-50"
              >
                {loading ? "Importing…" : `Import ${rows.length} rows`}
              </button>
            </div>
          </div>
        )}

        {/* Step: Done */}
        {step === "done" && result && (
          <div className="space-y-4">
            <div className="bg-white border border-[#E5E3DE] rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <CheckCircle2 size={20} className="text-green-500" />
                <span className="text-base font-semibold text-[#111]">Import Complete</span>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-green-700">{result.created}</p>
                  <p className="text-xs text-green-600 font-medium mt-1">Created</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-blue-700">{result.updated}</p>
                  <p className="text-xs text-blue-600 font-medium mt-1">Updated</p>
                </div>
                <div className="bg-[#F7F6F3] rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-[#888]">{result.skipped}</p>
                  <p className="text-xs text-[#888] font-medium mt-1">Skipped</p>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="border border-red-100 rounded-xl overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border-b border-red-100">
                    <AlertCircle size={13} className="text-red-500" />
                    <span className="text-xs font-semibold text-red-600">{result.errors.length} errors</span>
                  </div>
                  <div className="divide-y divide-red-50 max-h-48 overflow-y-auto">
                    {result.errors.map((e, i) => (
                      <div key={i} className="flex items-start gap-3 px-4 py-2.5">
                        <span className="text-xs text-[#aaa] font-mono shrink-0">Row {e.row}</span>
                        <span className="text-xs text-red-600">{e.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <button onClick={reset} className="text-sm text-[#888] hover:text-[#111] transition-colors">
                Import another file
              </button>
              <Link
                href="/items"
                className="text-sm font-semibold bg-[#111] text-white px-5 py-2 rounded-xl hover:bg-[#333] transition-colors"
              >
                View Items →
              </Link>
            </div>
          </div>
        )}

        {/* Template download hint */}
        {step === "upload" && (
          <div className="mt-6 flex items-center gap-2 text-xs text-[#aaa]">
            <span>Expected columns:</span>
            <code className="bg-white border border-[#E5E3DE] px-2 py-0.5 rounded text-[#666] font-mono">
              itemNumber, manufacturer, type, description, cost, price, category, active
            </code>
          </div>
        )}
      </div>
    </div>
  );
}