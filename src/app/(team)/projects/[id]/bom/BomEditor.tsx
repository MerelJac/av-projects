"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Search,
  Zap,
  Package,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

type Item = {
  id: string;
  itemNumber: string;
  manufacturer: string | null;
  price: number | null;
  cost: number | null;
  category: string | null;
  type: string;
};

type BOMLine = {
  id: string;
  itemId: string;
  item: Item;
  quantity: number;
  notes: string | null;
  sortOrder?: number;
};

type Quote = {
  id: string;
  status: string;
  total: number | null;
  createdAt: Date;
};

type BOM = {
  id: string;
  name: string;
  projectId: string;
  project: { id: string; name: string; customer: { name: string } };
  lines: BOMLine[];
  quotes: Quote[];
};

const quoteStatusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  SENT: "bg-blue-100 text-blue-700",
  ACCEPTED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-600",
};

export default function BOMEditor({
  bom,
  items,
  projectId,
  customerPrices,
}: {
  bom: BOM;
  items: Item[];
  projectId: string;
  customerPrices: Record<string, number>;
}) {
  const router = useRouter();
  const [lines, setLines] = useState<BOMLine[]>(bom.lines);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saved, setSaved] = useState(true);
  const [itemSearch, setItemSearch] = useState("");
  const [showItemPicker, setShowItemPicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  function effectivePrice(itemId: string, standardPrice: number | null): number | null {
    return customerPrices[itemId] ?? standardPrice;
  }

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const filteredItems = items.filter(
    (i) =>
      !lines.some((l) => l.itemId === i.id) &&
      (i.itemNumber.toLowerCase().includes(itemSearch.toLowerCase()) ||
        (i.manufacturer ?? "").toLowerCase().includes(itemSearch.toLowerCase()) ||
        (i.category ?? "").toLowerCase().includes(itemSearch.toLowerCase())),
  );

  function addLine(item: Item) {
    const newLine: BOMLine = {
      id: `temp-${Date.now()}`,
      itemId: item.id,
      item,
      quantity: 1,
      notes: null,
      sortOrder: lines.length,
    };
    setLines((prev) => [...prev, newLine]);
    setItemSearch("");
    setSaved(false);
  }

  function updateQuantity(lineId: string, qty: number) {
    setLines((prev) =>
      prev.map((l) => (l.id === lineId ? { ...l, quantity: Math.max(1, qty) } : l)),
    );
    setSaved(false);
  }

  function updateNotes(lineId: string, notes: string) {
    setLines((prev) => prev.map((l) => (l.id === lineId ? { ...l, notes } : l)));
    setSaved(false);
  }

  function removeLine(lineId: string) {
    setLines((prev) => prev.filter((l) => l.id !== lineId));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/boms/${bom.id}/lines`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lines: lines.map((l, i) => ({
            itemId: l.itemId,
            quantity: l.quantity,
            notes: l.notes,
            sortOrder: i,
          })),
        }),
      });
      if (!res.ok) throw new Error();
      setSaved(true);
      showToast("success", "BOM saved");
      router.refresh();
    } catch {
      showToast("error", "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerateQuote() {
    if (!saved) {
      showToast("error", "Save the BOM before generating a quote");
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/boms/${bom.id}/generate-quote`,
        { method: "POST" },
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      router.push(`/projects/${projectId}/quotes/${data.quoteId}`);
    } catch {
      showToast("error", "Failed to generate quote");
      setGenerating(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/boms/${bom.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      router.push(`/projects/${projectId}`);
    } catch {
      showToast("error", "Failed to delete BOM");
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  const totalCost = lines.reduce((sum, l) => sum + (l.item.cost ?? 0) * l.quantity, 0);
  const totalPrice = lines.reduce(
    (sum, l) => sum + (effectivePrice(l.itemId, l.item.price) ?? 0) * l.quantity,
    0,
  );

  return (
    <div className="min-h-screen bg-[#F7F6F3]">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium shadow-lg border transition-all ${
          toast.type === "success"
            ? "bg-white border-green-200 text-green-700"
            : "bg-white border-red-200 text-red-600"
        }`}>
          {toast.type === "success" ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
          {toast.msg}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-[#E5E3DE] p-6 max-w-sm w-full mx-4">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center mb-4">
              <Trash2 size={18} className="text-red-500" />
            </div>
            <h2 className="text-base font-bold text-[#111] mb-1">Delete BOM?</h2>
            <p className="text-sm text-[#666] mb-1">
              <span className="font-semibold text-[#111]">{bom.name}</span> will be permanently deleted.
            </p>
            {bom.quotes.length > 0 && (
              <p className="text-sm text-amber-600 bg-amber-50 rounded-xl px-3 py-2 mt-3">
                ⚠️ This BOM has {bom.quotes.length} generated quote{bom.quotes.length !== 1 ? "s" : ""}. The quotes will remain but will no longer be linked to this BOM.
              </p>
            )}
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 text-sm font-semibold px-4 py-2.5 rounded-xl border border-[#E5E3DE] hover:bg-[#F7F6F3] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 text-sm font-semibold px-4 py-2.5 rounded-xl bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {deleting ? "Deleting…" : "Delete BOM"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Back */}
        <button
          onClick={() => router.push(`/projects/${projectId}`)}
          className="flex items-center gap-2 text-sm text-[#666] hover:text-[#111] mb-6 transition-colors"
        >
          <ArrowLeft size={15} />
          {bom.project.name}
        </button>

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#999] mb-1">
              <span>{bom.project.customer.name}</span>
              <span>·</span>
              <span>{bom.project.name}</span>
            </div>
            <h1 className="text-2xl font-bold text-[#111] tracking-tight">{bom.name}</h1>
            <p className="text-sm text-[#888] mt-1">
              {lines.length} item{lines.length !== 1 ? "s" : ""}
              {!saved && <span className="text-amber-600 ml-2">· Unsaved changes</span>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-[#E5E3DE] bg-white hover:bg-red-50 hover:border-red-200 text-[#ccc] hover:text-red-500 transition-colors"
              title="Delete BOM"
            >
              <Trash2 size={15} />
            </button>
            <button
              onClick={handleSave}
              disabled={saving || saved}
              className="text-sm font-semibold px-4 py-2 rounded-xl border border-[#E5E3DE] bg-white hover:bg-[#F7F6F3] disabled:opacity-40 transition-colors"
            >
              {saving ? "Saving…" : saved ? "Saved ✓" : "Save Changes"}
            </button>
            <button
              onClick={handleGenerateQuote}
              disabled={generating || lines.length === 0}
              className="flex items-center gap-2 bg-[#111] text-white text-sm font-semibold px-5 py-2 rounded-xl hover:bg-[#333] disabled:opacity-40 transition-colors"
            >
              <Zap size={14} />
              {generating ? "Generating…" : "Generate Quote"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Line Items — left 2/3 */}
          <div className="col-span-2 space-y-4">
            {/* Add item */}
            <div className="bg-white border border-[#E5E3DE] rounded-2xl">
              <div className="px-5 py-4 border-b border-[#F0EEE9]">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#888]">
                  Add Items
                </p>
              </div>
              <div className="p-4 relative">
                <div className="relative">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#bbb]" />
                  <input
                    ref={searchRef}
                    type="text"
                    value={itemSearch}
                    onChange={(e) => { setItemSearch(e.target.value); setShowItemPicker(true); }}
                    onFocus={() => setShowItemPicker(true)}
                    placeholder="Search by item #, manufacturer, or category…"
                    className="w-full pl-9 pr-4 py-2.5 border border-[#E5E3DE] rounded-xl text-sm text-[#111] placeholder:text-[#bbb] focus:outline-none focus:border-[#111] transition-colors"
                  />
                </div>
                {showItemPicker && itemSearch && (
                  <div
                    className="absolute left-4 right-4 top-full mt-1 bg-white border border-[#E5E3DE] rounded-xl shadow-lg z-20 max-h-64 overflow-y-auto"
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    {filteredItems.length === 0 ? (
                      <p className="text-sm text-[#999] px-4 py-3">No matching items</p>
                    ) : (
                      filteredItems.slice(0, 20).map((item) => (
                        <button
                          key={item.id}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            addLine(item);
                            setShowItemPicker(false);
                            setItemSearch("");
                          }}
                          className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-[#F7F6F3] transition-colors text-left border-b border-[#F0EEE9] last:border-0"
                        >
                          <div>
                            <span className="text-sm font-medium text-[#111]">{item.itemNumber}</span>
                            {item.manufacturer && (
                              <span className="text-xs text-[#999] ml-2">{item.manufacturer}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-[#999]">
                            {item.category && (
                              <span className="bg-[#F0EEE9] px-2 py-0.5 rounded-md">{item.category}</span>
                            )}
                            {(() => {
                              const price = effectivePrice(item.id, item.price);
                              const hasCustom = customerPrices[item.id] != null;
                              return price != null ? (
                                <span className={`font-medium ${hasCustom ? "text-blue-600" : "text-[#111]"}`}>
                                  ${price.toLocaleString()}
                                  {hasCustom && <span className="text-[10px] ml-1 text-[#bbb]">custom</span>}
                                </span>
                              ) : null;
                            })()}
                            <Plus size={13} className="text-[#111]" />
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Lines table */}
            <div className="bg-white border border-[#E5E3DE] rounded-2xl overflow-hidden">
              {lines.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Package size={32} className="text-[#ddd] mb-3" />
                  <p className="text-sm font-medium text-[#999]">No items yet</p>
                  <p className="text-xs text-[#bbb] mt-1">Search above to add items to this BOM</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#F0EEE9]">
                      <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-[#999] px-5 py-3">Item</th>
                      <th className="text-right text-[10px] font-semibold uppercase tracking-widest text-[#999] px-3 py-3 w-24">Qty</th>
                      <th className="text-right text-[10px] font-semibold uppercase tracking-widest text-[#999] px-3 py-3 w-28">Unit Price</th>
                      <th className="text-right text-[10px] font-semibold uppercase tracking-widest text-[#999] px-5 py-3 w-28">Extended</th>
                      <th className="w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((line) => (
                      <tr key={line.id} className="border-b border-[#F7F6F3] last:border-0 group">
                        <td className="px-5 py-3">
                          <p className="text-sm font-medium text-[#111]">{line.item.itemNumber}</p>
                          {line.item.manufacturer && (
                            <p className="text-xs text-[#999] mt-0.5">{line.item.manufacturer}</p>
                          )}
                          <input
                            type="text"
                            value={line.notes ?? ""}
                            onChange={(e) => updateNotes(line.id, e.target.value)}
                            placeholder="Add note…"
                            className="mt-1.5 w-full text-xs text-[#666] placeholder:text-[#ccc] focus:outline-none border-0 bg-transparent"
                          />
                        </td>
                        <td className="px-3 py-3 text-right">
                          <input
                            type="number"
                            min={1}
                            value={line.quantity}
                            onChange={(e) => updateQuantity(line.id, parseInt(e.target.value) || 1)}
                            className="w-16 text-right text-sm border border-[#E5E3DE] rounded-lg px-2 py-1 focus:outline-none focus:border-[#111] transition-colors"
                          />
                        </td>
                        <td className="px-3 py-3 text-right text-sm text-[#666]">
                          {(() => {
                            const price = effectivePrice(line.itemId, line.item.price);
                            const hasCustom = customerPrices[line.itemId] != null;
                            if (price == null) return "—";
                            return (
                              <div className="flex flex-col items-end gap-0.5">
                                <span className={hasCustom ? "text-blue-600 font-medium" : ""}>
                                  ${price.toLocaleString()}
                                </span>
                                {hasCustom && line.item.price != null && (
                                  <span className="text-[10px] text-[#bbb] line-through">
                                    ${line.item.price.toLocaleString()}
                                  </span>
                                )}
                              </div>
                            );
                          })()}
                        </td>
                        <td className="px-5 py-3 text-right text-sm font-semibold text-[#111]">
                          {(() => {
                            const price = effectivePrice(line.itemId, line.item.price);
                            return price != null ? `$${(price * line.quantity).toLocaleString()}` : "—";
                          })()}
                        </td>
                        <td className="pr-3">
                          <button
                            onClick={() => removeLine(line.id)}
                            className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-[#ccc] hover:text-red-500 transition-all"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-white border border-[#E5E3DE] rounded-2xl p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#888] mb-4">Summary</p>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[#666]">Total Cost</span>
                  <span className="font-semibold text-[#111]">
                    ${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#666]">Total Price</span>
                  <span className="font-semibold text-[#111]">
                    ${totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="border-t border-[#F0EEE9] pt-3 flex justify-between text-sm">
                  <span className="text-[#666]">Margin</span>
                  <span className={`font-bold ${totalPrice > totalCost ? "text-green-600" : "text-red-600"}`}>
                    {totalPrice > 0
                      ? `${(((totalPrice - totalCost) / totalPrice) * 100).toFixed(1)}%`
                      : "—"}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-[#E5E3DE] rounded-2xl p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#888] mb-4">
                Quotes from this BOM
              </p>
              {bom.quotes.length === 0 ? (
                <p className="text-sm text-[#bbb]">No quotes generated yet</p>
              ) : (
                <div className="space-y-2">
                  {bom.quotes.map((q) => (
                    <a
                      key={q.id}
                      href={`/projects/${projectId}/quotes/${q.id}`}
                      className="flex items-center justify-between p-3 border border-[#F0EEE9] rounded-xl hover:border-[#E5E3DE] hover:bg-[#F7F6F3] transition-all"
                    >
                      <div>
                        <p className="text-xs font-mono font-semibold text-[#111]">
                          #{q.id.slice(0, 8).toUpperCase()}
                        </p>
                        <p className="text-[10px] text-[#999] mt-0.5">
                          {new Date(q.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {q.total != null && (
                          <span className="text-xs font-semibold text-[#111]">
                            ${q.total.toLocaleString()}
                          </span>
                        )}
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${quoteStatusColors[q.status]}`}>
                          {q.status}
                        </span>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showItemPicker && (
        <div className="fixed inset-0 z-10" onClick={() => setShowItemPicker(false)} />
      )}
    </div>
  );
}
