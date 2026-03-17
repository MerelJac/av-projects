"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Package } from "lucide-react";

type QuoteLine = {
  id: string;
  description: string;
  quantity: number;
  price: number;
  cost: number | null;
  item: { id: string; itemNumber: string; manufacturer: string | null } | null;
};

export default function CreatePOModal({
  projectId,
  quoteId,
  lines,
  onClose,
}: {
  projectId: string;
  quoteId: string;
  lines: QuoteLine[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [vendor, setVendor] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const selectedLines = lines.filter((l) => selected.has(l.id));

  async function handleCreate() {
    if (!vendor.trim()) { setError("Vendor name is required"); return; }
    if (selected.size === 0) { setError("Select at least one item"); return; }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/purchase-orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendor: vendor.trim(),
          quoteId,
          projectId,
          lines: selectedLines.map((l) => ({
            itemId: l.item?.id ?? null,
            description: l.description,
            quantity: l.quantity,
            cost: l.cost ?? 0,
          })),
        }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
      onClose();
    } catch {
      setError("Failed to create PO");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-[#E5E3DE] w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-[#F0EEE9] flex items-start justify-between">
          <div>
            <h2 className="text-base font-bold text-[#111]">Create Purchase Order</h2>
            <p className="text-sm text-[#888] mt-0.5">Select items and assign a vendor.</p>
          </div>
          <button onClick={onClose} className="text-[#ccc] hover:text-[#666] transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Vendor */}
        <div className="px-6 py-4 border-b border-[#F0EEE9]">
          <label className="text-xs font-semibold uppercase tracking-widest text-[#888] block mb-2">
            Vendor
          </label>
          <input
            type="text"
            value={vendor}
            onChange={(e) => setVendor(e.target.value)}
            placeholder="e.g. Crestron, Biamp, Amazon…"
            className="w-full text-sm border border-[#E5E3DE] rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#111] transition-colors"
          />
        </div>

        {/* Line items */}
        <div className="max-h-72 overflow-y-auto divide-y divide-[#F0EEE9]">
          {lines.map((line) => (
            <button
              key={line.id}
              onClick={() => toggle(line.id)}
              className="w-full flex items-center gap-3 px-6 py-3.5 hover:bg-[#F7F6F3] transition-colors text-left"
            >
              <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-colors ${
                selected.has(line.id) ? "bg-[#111] border-[#111]" : "border-[#D0CEC8] bg-white"
              }`}>
                {selected.has(line.id) && (
                  <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                    <polyline points="1,3.5 3.5,6 8,1" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#111] truncate">{line.description}</p>
                {line.item && (
                  <p className="text-xs text-[#999] mt-0.5 font-mono">{line.item.itemNumber}</p>
                )}
              </div>
              <span className="text-xs text-[#999] flex-shrink-0">qty {line.quantity}</span>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#F0EEE9] bg-[#FAFAF8] flex items-center justify-between">
          <div className="text-sm text-[#888]">
            {selected.size === 0 ? "No items selected" : (
              <><span className="font-semibold text-[#111]">{selected.size}</span> item{selected.size !== 1 ? "s" : ""} selected</>
            )}
          </div>
          <div className="flex items-center gap-2">
            {error && <p className="text-xs text-red-600">{error}</p>}
            <button
              onClick={handleCreate}
              disabled={saving || selected.size === 0 || !vendor.trim()}
              className="flex items-center gap-2 bg-[#111] text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-[#333] disabled:opacity-40 transition-colors"
            >
              <Package size={13} />
              {saving ? "Creating…" : "Create PO"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}