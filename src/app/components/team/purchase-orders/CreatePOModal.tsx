"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Package, Tag } from "lucide-react";
import { VendorSelect } from "@/app/(team)/vendors/VendorSelect";

type QuoteLine = {
  id: string;
  description: string;
  quantity: number;
  price: number;
  cost: number | null;
  item: { id: string; itemNumber: string; manufacturer: string | null } | null;
};

type VendorPrice = { itemId: string; cost: number };

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
  const [claimedIds, setClaimedIds] = useState<Set<string>>(new Set());
  const [loadingClaimed, setLoadingClaimed] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [vendorId, setVendorId] = useState("");
  const [vendorPrices, setVendorPrices] = useState<Map<string, number>>(new Map());
  const [costOverrides, setCostOverrides] = useState<Map<string, string>>(new Map());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch claimed lines on mount
  useEffect(() => {
    fetch(`/api/projects/${projectId}/purchase-orders/claimed-lines?quoteId=${quoteId}`)
      .then((r) => r.json())
      .then((ids: string[]) => setClaimedIds(new Set(ids)))
      .catch(() => {})
      .finally(() => setLoadingClaimed(false));
  }, [projectId, quoteId]);

  // Fetch vendor pricing when vendor changes
  useEffect(() => {
    if (!vendorId) { setVendorPrices(new Map()); return; }
    fetch(`/api/vendors/${vendorId}/item-prices`)
      .then((r) => r.json())
      .then((prices: VendorPrice[]) => {
        setVendorPrices(new Map(prices.map((p) => [p.itemId, p.cost])));
        // Reset overrides when vendor changes
        setCostOverrides(new Map());
      })
      .catch(() => {});
  }, [vendorId]);

  const toggle = (id: string) => {
    if (claimedIds.has(id)) return;
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  function getEffectiveCost(line: QuoteLine): number {
    const override = costOverrides.get(line.id);
    if (override !== undefined) return parseFloat(override) || 0;
    if (line.item && vendorPrices.has(line.item.id)) return vendorPrices.get(line.item.id)!;
    return line.cost ?? 0;
  }

  function isOverridden(line: QuoteLine): boolean {
    const override = costOverrides.get(line.id);
    if (override === undefined) return false;
    const vendorCost = line.item ? vendorPrices.get(line.item.id) : undefined;
    return vendorCost !== undefined && parseFloat(override) !== vendorCost;
  }

  const selectedLines = lines.filter((l) => selected.has(l.id));

  async function handleCreate() {
    if (!vendorId) { setError("Vendor is required"); return; }
    if (selected.size === 0) { setError("Select at least one item"); return; }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/purchase-orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId,
          quoteId,
          projectId,
          lines: selectedLines.map((l) => ({
            itemId: l.item?.id ?? null,
            description: l.description,
            quantity: l.quantity,
            cost: getEffectiveCost(l),
          })),
        }),
      });
      if (!res.ok) throw new Error();
      router.push(`/projects/${projectId}/purchase-orders/${(await res.json()).poId}`);
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
          <VendorSelect value={vendorId} onChange={setVendorId} required />
        </div>

        {/* Line items */}
        <div className="max-h-72 overflow-y-auto divide-y divide-[#F0EEE9]">
          {loadingClaimed ? (
            <p className="px-6 py-8 text-sm text-[#bbb] text-center animate-pulse">Loading…</p>
          ) : (
            lines.map((line) => {
              const claimed = claimedIds.has(line.id);
              const isSelected = selected.has(line.id);
              const vendorCost = line.item ? vendorPrices.get(line.item.id) : undefined;
              const overrideVal = costOverrides.get(line.id);
              const overridden = isOverridden(line);

              return (
                <div key={line.id} className={`transition-colors ${claimed ? "opacity-40 bg-[#F7F6F3]" : ""}`}>
                  <button
                    onClick={() => toggle(line.id)}
                    disabled={claimed}
                    className={`w-full flex items-center gap-3 px-6 py-3 transition-colors text-left ${
                      claimed ? "cursor-not-allowed" : "hover:bg-[#F7F6F3]"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-colors ${
                      claimed
                        ? "border-[#D0CEC8] bg-[#F0EEE9]"
                        : isSelected
                        ? "bg-[#111] border-[#111]"
                        : "border-[#D0CEC8] bg-white"
                    }`}>
                      {isSelected && !claimed && (
                        <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                          <polyline points="1,3.5 3.5,6 8,1" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                      {claimed && (
                        <svg width="8" height="9" viewBox="0 0 8 9" fill="none">
                          <rect x="1" y="4" width="6" height="5" rx="1" fill="#999" />
                          <path d="M2 4V3a2 2 0 1 1 4 0v1" stroke="#999" strokeWidth="1.2" fill="none" />
                        </svg>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#111] truncate">{line.description}</p>
                      {line.item && (
                        <p className="text-xs text-[#999] mt-0.5 font-mono">{line.item.itemNumber}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {claimed && (
                        <span className="text-[10px] font-semibold text-[#999] bg-[#F0EEE9] px-1.5 py-0.5 rounded">
                          On PO
                        </span>
                      )}
                      <span className="text-xs text-[#999]">qty {line.quantity}</span>
                      {vendorCost !== undefined && (
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                          <Tag size={9} />
                          ${vendorCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      )}
                    </div>
                  </button>

                  {/* Cost override — only show when selected and vendor has a price or item has a cost */}
                  {isSelected && !claimed && vendorId && (
                    <div className="px-6 pb-3 flex items-center gap-2">
                      <span className="text-xs text-[#999]">Cost each:</span>
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-[#999]">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={overrideVal ?? (vendorCost !== undefined ? String(vendorCost) : String(line.cost ?? ""))}
                          onChange={(e) =>
                            setCostOverrides((prev) => {
                              const next = new Map(prev);
                              next.set(line.id, e.target.value);
                              return next;
                            })
                          }
                          className={`w-28 text-sm border rounded-lg pl-5 pr-2 py-1 focus:outline-none focus:border-[#111] ${
                            overridden ? "border-amber-300 bg-amber-50" : "border-[#E5E3DE]"
                          }`}
                        />
                      </div>
                      {vendorCost !== undefined && (
                        <span className="text-[10px] text-[#bbb]">
                          {overridden ? "overriding vendor price" : "vendor default"}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
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
              disabled={saving || selected.size === 0 || !vendorId}
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
