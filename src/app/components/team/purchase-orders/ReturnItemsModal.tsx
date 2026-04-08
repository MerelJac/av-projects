"use client";
import { useState } from "react";
import { X, AlertCircle, RotateCcw } from "lucide-react";

type POLineForReturn = {
  id: string;
  quantity: number;
  receivedQuantity: number;
  cost: number;
  // sum of all non-cancelled existing return quantities for this line
  alreadyReturnedQuantity: number;
  item: {
    itemNumber: string;
    manufacturer: string | null;
    description: string | null;
  };
};

export default function ReturnItemsModal({
  projectId,
  poId,
  lines,
  onSaved,
  onCancel,
}: {
  projectId: string;
  poId: string;
  lines: POLineForReturn[];
  onSaved: () => void;
  onCancel: () => void;
}) {
  const returnableLines = lines.filter(
    (l) => l.receivedQuantity - l.alreadyReturnedQuantity > 0
  );

  const [quantities, setQuantities] = useState<Record<string, number>>(() =>
    Object.fromEntries(returnableLines.map((l) => [l.id, 0]))
  );
  const [credits, setCredits] = useState<Record<string, string>>(() =>
    Object.fromEntries(returnableLines.map((l) => [l.id, String(l.cost)]))
  );
  const [disposition, setDisposition] = useState<"RETURN_TO_VENDOR" | "KEEP_IN_INVENTORY">("RETURN_TO_VENDOR");
  const [reason, setReason] = useState("");
  const [rmaNumber, setRmaNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedLines = returnableLines.filter((l) => quantities[l.id] > 0);
  const totalCredit = selectedLines.reduce(
    (s, l) => s + quantities[l.id] * (parseFloat(credits[l.id]) || 0),
    0
  );

  async function handleSave() {
    if (!selectedLines.length) {
      setError("Select at least one item to return");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/purchase-orders/${poId}/returns`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            disposition,
            reason: reason || null,
            rmaNumber: rmaNumber || null,
            notes: notes || null,
            lines: selectedLines.map((l) => ({
              poLineId: l.id,
              quantity: quantities[l.id],
              creditPerUnit: parseFloat(credits[l.id]) || null,
            })),
          }),
        }
      );
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        setError(b?.error ?? "Failed to create return");
        return;
      }
      onSaved();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="px-6 py-4 border-b border-[#F0EEE9] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RotateCcw size={15} className="text-[#666]" />
            <h3 className="text-sm font-semibold text-[#111]">Return Items to Vendor</h3>
          </div>
          <button onClick={onCancel} className="text-[#999] hover:text-[#111]">
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Disposition toggle */}
          <div>
            <p className="text-xs font-semibold text-[#666] uppercase tracking-widest mb-2">
              What happens to the items?
            </p>
            <div className="flex gap-2">
              {(["RETURN_TO_VENDOR", "KEEP_IN_INVENTORY"] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDisposition(d)}
                  className={`flex-1 text-xs font-semibold px-3 py-2 rounded-xl border transition-all ${
                    disposition === d
                      ? "bg-[#111] text-white border-[#111]"
                      : "bg-white text-[#666] border-[#E5E3DE] hover:bg-[#F7F6F3]"
                  }`}
                >
                  {d === "RETURN_TO_VENDOR" ? "Return to vendor" : "Keep in our inventory"}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-[#bbb] mt-1.5">
              {disposition === "KEEP_IN_INVENTORY"
                ? "Item stays in stock. Customer still gets the cost credit."
                : "Item leaves the building. Inventory decremented."}
            </p>
          </div>

          {returnableLines.length === 0 ? (
            <p className="text-sm text-[#999] text-center py-4">
              No received items available to return
            </p>
          ) : (
            <>
              {/* Line item table */}
              <div>
                <p className="text-xs font-semibold text-[#666] uppercase tracking-widest mb-2">
                  Select items to return
                </p>
                <div className="border border-[#E5E3DE] rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#F0EEE9] bg-[#FAFAF9]">
                        <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-[#999] px-4 py-2.5">
                          Item
                        </th>
                        <th className="text-right text-[10px] font-semibold uppercase tracking-widest text-[#999] px-3 py-2.5 w-20">
                          Available
                        </th>
                        <th className="text-right text-[10px] font-semibold uppercase tracking-widest text-[#999] px-3 py-2.5 w-24">
                          Qty
                        </th>
                        <th className="text-right text-[10px] font-semibold uppercase tracking-widest text-[#999] px-4 py-2.5 w-28">
                          Credit/Unit
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {returnableLines.map((l) => {
                        const available = l.receivedQuantity - l.alreadyReturnedQuantity;
                        return (
                          <tr key={l.id} className="border-b border-[#F7F6F3] last:border-0">
                            <td className="px-4 py-3">
                              <p className="text-sm font-mono text-[#111]">{l.item.itemNumber}</p>
                              {l.item.manufacturer && (
                                <p className="text-[10px] text-[#999]">{l.item.manufacturer}</p>
                              )}
                            </td>
                            <td className="px-3 py-3 text-right text-sm text-[#666]">
                              {available}
                            </td>
                            <td className="px-3 py-3 text-right">
                              <input
                                type="number"
                                min={0}
                                max={available}
                                value={quantities[l.id]}
                                onChange={(e) =>
                                  setQuantities((q) => ({
                                    ...q,
                                    [l.id]: Math.min(
                                      parseInt(e.target.value) || 0,
                                      available
                                    ),
                                  }))
                                }
                                className="w-16 text-sm text-right border border-[#E5E3DE] rounded-lg px-2 py-1 focus:outline-none focus:border-[#111]"
                              />
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <span className="text-xs text-[#999]">$</span>
                                <input
                                  type="number"
                                  min={0}
                                  step="0.01"
                                  value={credits[l.id]}
                                  onChange={(e) =>
                                    setCredits((c) => ({ ...c, [l.id]: e.target.value }))
                                  }
                                  className="w-20 text-sm text-right border border-[#E5E3DE] rounded-lg px-2 py-1 focus:outline-none focus:border-[#111]"
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Credit total preview */}
              {selectedLines.length > 0 && (
                <div className="flex justify-between items-center text-sm px-1">
                  <span className="text-[#666]">Expected credit</span>
                  <span className="font-bold text-green-700">
                    ${totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              {/* Return details */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#666] block mb-1">
                    Reason
                  </label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Defective, wrong item…"
                    className="w-full text-sm border border-[#E5E3DE] rounded-xl px-3 py-2 focus:outline-none focus:border-[#111]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#666] block mb-1">
                    RMA #
                  </label>
                  <input
                    type="text"
                    value={rmaNumber}
                    onChange={(e) => setRmaNumber(e.target.value)}
                    placeholder="Vendor RMA number"
                    className="w-full text-sm border border-[#E5E3DE] rounded-xl px-3 py-2 focus:outline-none focus:border-[#111]"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#666] block mb-1">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Additional notes…"
                  className="w-full text-sm border border-[#E5E3DE] rounded-xl px-3 py-2 focus:outline-none focus:border-[#111] resize-none"
                />
              </div>
            </>
          )}

          {error && (
            <p className="text-xs text-red-600 flex items-center gap-1.5">
              <AlertCircle size={11} />
              {error}
            </p>
          )}
        </div>

        <div className="px-6 py-4 border-t border-[#F0EEE9] flex justify-end gap-3">
          <button onClick={onCancel} className="text-sm text-[#666] hover:text-[#111]">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || returnableLines.length === 0}
            className="text-sm font-semibold px-4 py-2 rounded-xl bg-[#111] text-white hover:bg-[#333] disabled:opacity-40 transition-colors"
          >
            {saving ? "Creating…" : "Create Return"}
          </button>
        </div>
      </div>
    </div>
  );
}
