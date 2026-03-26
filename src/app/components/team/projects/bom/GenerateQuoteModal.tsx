// src/app/components/team/projects/bom/GenerateQuoteModal.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, X } from "lucide-react";

type BOMSummary = {
  id: string;
  name: string;
  lineCount: number;
  total: number;
};

export default function GenerateQuoteModal({
  boms,
  projectId,
  onClose,
}: {
  boms: BOMSummary[];
  projectId: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(
    new Set(boms.map((b) => b.id)),
  );
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const selectedBoms = boms.filter((b) => selected.has(b.id));
  const totalItems = selectedBoms.reduce((s, b) => s + b.lineCount, 0);
  const grandTotal = selectedBoms.reduce((s, b) => s + b.total, 0);
  const [type, setType] = useState<"CHANGE_ORDER" | "DIRECT" | "PROPOSAL">(
    "PROPOSAL",
  );

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/quotes/generate-from-boms`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bomIds: [...selected], type }),
        },
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      router.push(`/projects/${projectId}/quotes/${data.quoteId}`);
    } catch {
      setError(`Failed to generate ${type.toLowerCase()}. Please try again.`);
      setGenerating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-[#E5E3DE] w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-[#F0EEE9] flex items-start justify-between">
          <div>
            <h2 className="text-base font-bold text-[#111]">
              Generate {type.toLowerCase()} from BOMs
            </h2>
            <p className="text-sm text-[#888] mt-0.5">
              Select one or more BOMs to combine into a single{" "}
              {type.toLowerCase()}.
            </p>
          </div>
          {/* Toggle to switch type */}
          <div className="absolute top-4 right-4 flex items-center gap-2 text-xs">
            <span className="text-[#666]">Type:</span>
            <select
              value={type}
              onChange={(e) =>
                setType(
                  e.target.value as "PROPOSAL" | "DIRECT" | "CHANGE_ORDER",
                )
              }
              className="text-sm text-[#111] border border-[#E5E3DE] rounded-lg px-2 py-1 focus:outline-none focus:border-[#111] transition-colors bg-white"
            >
              <option value="PROPOSAL">Proposal</option>
              <option value="DIRECT">Direct Quote</option>
              <option value="CHANGE_ORDER">Change Order</option>
            </select>
          </div>

          <button
            onClick={onClose}
            className="text-[#ccc] hover:text-[#666] transition-colors mt-0.5"
          >
            <X size={16} />
          </button>
        </div>

        {/* BOM list */}
        <div className="divide-y divide-[#F0EEE9] max-h-72 overflow-y-auto">
          {boms.map((bom) => (
            <button
              key={bom.id}
              onClick={() => toggle(bom.id)}
              className="w-full flex items-center gap-3 px-6 py-3.5 hover:bg-[#F7F6F3] transition-colors text-left"
            >
              {/* Checkbox */}
              <div
                className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-colors ${
                  selected.has(bom.id)
                    ? "bg-[#111] border-[#111]"
                    : "border-[#D0CEC8] bg-white"
                }`}
              >
                {selected.has(bom.id) && (
                  <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                    <polyline
                      points="1,3.5 3.5,6 8,1"
                      stroke="white"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#111] truncate">
                  {bom.name}
                </p>
                <p className="text-xs text-[#999] mt-0.5">
                  {bom.lineCount} item{bom.lineCount !== 1 ? "s" : ""}
                </p>
              </div>
              <span className="text-sm font-semibold text-[#111]">
                $
                {bom.total.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </span>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#F0EEE9] bg-[#FAFAF8] flex items-center justify-between">
          <div className="text-sm text-[#888]">
            {selected.size === 0 ? (
              "No BOMs selected"
            ) : (
              <>
                <span className="font-semibold text-[#111]">
                  {selected.size}
                </span>{" "}
                BOM
                {selected.size !== 1 ? "s" : ""} · {totalItems} items ·{" "}
                <span className="font-semibold text-[#111]">
                  $
                  {grandTotal.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </>
            )}
          </div>
          <button
            onClick={handleGenerate}
            disabled={selected.size === 0 || generating}
            className="flex items-center gap-2 bg-[#111] text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-[#333] disabled:opacity-40 transition-colors"
          >
            <Zap size={13} />
            {generating ? "Generating…" : `Generate ${type.toLowerCase()}`}
          </button>
        </div>

        {error && <p className="px-6 pb-4 text-xs text-red-600">{error}</p>}
      </div>
    </div>
  );
}
