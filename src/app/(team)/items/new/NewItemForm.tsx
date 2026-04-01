"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, AlertCircle, Package } from "lucide-react";
import Link from "next/link";

const ITEM_TYPES = ["HARDWARE", "SOFTWARE", "SUBSCRIPTION", "SERVICE"] as const;

export default function NewItemForm({ units }: { units: string[] }) {
  const router = useRouter();

  const [itemNumber, setItemNumber] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [type, setType] = useState<string>("HARDWARE");
  const [category, setCategory] = useState("");
  const [cost, setCost] = useState("");
  const [price, setPrice] = useState("");
  const [lastSoldPrice, setLastSoldPrice] = useState("");
  const [eolDate, setEolDate] = useState("");
  const [description, setDescription] = useState("");
  const [active, setActive] = useState(true);
  const [unit, setUnit] = useState("");
  const [approved, setApproved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!itemNumber.trim()) {
      setError("Item number is required");
      return;
    }
    if (!type) {
      setError("Type is required");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemNumber: itemNumber.trim(),
          manufacturer: manufacturer.trim() || null,
          type,
          category: category.trim() || null,
          cost: cost ? parseFloat(cost) : null,
          price: price ? parseFloat(price) : null,
          lastSoldPrice: lastSoldPrice ? parseFloat(lastSoldPrice) : null,
          description: description.trim() || null,
          eolDate: eolDate || null,
          active,
          approved,
          unit: unit || null,
        }),
      });

      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        setError(b?.error ?? "Failed to create item");
        return;
      }

      const item = await res.json();
      router.push(`/items/${item.id}`);
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-[#F7F6F3]">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <Link
          href="/items"
          className="flex items-center gap-2 text-sm text-[#666] hover:text-[#111] mb-6 transition-colors"
        >
          <ArrowLeft size={15} />
          Inventory
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-[#111] flex items-center justify-center">
            <Package size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#111] tracking-tight">
              New Item
            </h1>
            <p className="text-sm text-[#999]">Add an item to the catalog</p>
          </div>
        </div>

        <div className="bg-white border border-[#E5E3DE] rounded-2xl overflow-hidden">
          {/* Identity */}
          <div className="px-6 py-5 border-b border-[#F0EEE9]">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#888] mb-4">
              Identity
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[#666] block mb-1">
                  Item Number *
                </label>
                <input
                  type="text"
                  value={itemNumber}
                  onChange={(e) => setItemNumber(e.target.value)}
                  placeholder="e.g. PS-CAD, NV-SW-001"
                  className="w-full text-sm border border-[#E5E3DE] rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#111] font-mono"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#666] block mb-1">
                  Manufacturer
                </label>
                <input
                  type="text"
                  value={manufacturer}
                  onChange={(e) => setManufacturer(e.target.value)}
                  placeholder="e.g. Crestron, Extron…"
                  className="w-full text-sm border border-[#E5E3DE] rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#111]"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#666] block mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the item…"
                  rows={2}
                  className="w-full text-sm border border-[#E5E3DE] rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#111] resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#666] block mb-1">
                    Type *
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full text-sm border border-[#E5E3DE] rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#111] bg-white"
                  >
                    {ITEM_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#666] block mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Display, Control…"
                    className="w-full text-sm border border-[#E5E3DE] rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#111]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="px-6 py-5 border-b border-[#F0EEE9]">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#888] mb-4">
              Pricing
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#666] block mb-1">
                  Cost
                </label>
                <div className="flex items-center gap-1.5 border border-[#E5E3DE] rounded-xl px-3 py-2.5 focus-within:border-[#111]">
                  <span className="text-xs text-[#999]">$</span>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    placeholder="0.00"
                    className="text-sm text-[#111] focus:outline-none bg-transparent w-full"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#666] block mb-1">
                  Price
                </label>
                <div className="flex items-center gap-1.5 border border-[#E5E3DE] rounded-xl px-3 py-2.5 focus-within:border-[#111]">
                  <span className="text-xs text-[#999]">$</span>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                    className="text-sm text-[#111] focus:outline-none bg-transparent w-full"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#666] block mb-1">
                  Unit
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full text-sm border border-[#E5E3DE] rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#111] bg-white"
                >
                  <option value="">— None —</option>
                  {units.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="px-6 py-5 border-b border-[#F0EEE9]">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#888] mb-4">
              Status
            </p>
            <div className="space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-sm font-medium text-[#111]">Active</p>
                  <p className="text-xs text-[#999]">
                    Item is available for use in BOMs and quotes
                  </p>
                </div>
                <div
                  onClick={() => setActive((p) => !p)}
                  className={`w-10 h-6 rounded-full transition-colors cursor-pointer ${active ? "bg-[#111]" : "bg-[#E5E3DE]"}`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full mt-1 transition-transform ${active ? "translate-x-5" : "translate-x-1"}`}
                  />
                </div>
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-sm font-medium text-[#111]">Approved</p>
                  <p className="text-xs text-[#999]">
                    Item has been reviewed and approved
                  </p>
                </div>
                <div
                  onClick={() => setApproved((p) => !p)}
                  className={`w-10 h-6 rounded-full transition-colors cursor-pointer ${approved ? "bg-[#111]" : "bg-[#E5E3DE]"}`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full mt-1 transition-transform ${approved ? "translate-x-5" : "translate-x-1"}`}
                  />
                </div>
              </label>
              <div>
                <label className="text-xs font-semibold text-[#666] block mb-1">
                  EOL Date
                </label>
                <input
                  type="date"
                  value={eolDate}
                  onChange={(e) => setEolDate(e.target.value)}
                  className="text-sm border border-[#E5E3DE] rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#111]"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 flex items-center justify-between">
            {error ? (
              <p className="text-xs text-red-600 flex items-center gap-1.5">
                <AlertCircle size={12} /> {error}
              </p>
            ) : (
              <div />
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="text-sm font-semibold px-5 py-2.5 rounded-xl bg-[#111] text-white hover:bg-[#333] disabled:opacity-40 transition-colors"
            >
              {saving ? "Creating…" : "Create Item"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
