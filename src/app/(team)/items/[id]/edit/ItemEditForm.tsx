"use client";
// src/app/(team)/items/[id]/edit/ItemEditForm.tsx
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, AlertCircle } from "lucide-react";

type ItemType = "HARDWARE" | "SOFTWARE" | "SUBSCRIPTION" | "SERVICE";

type Item = {
  id: string;
  itemNumber: string;
  manufacturer: string | null;
  cost: number | null;
  price: number | null;
  lastSoldPrice: number | null;
  category: string | null;
  type: ItemType;
  active: boolean;
  approved: boolean;
  eolDate: string | null;
  description: string | null;
  unit: string | null;
  preferredVendorId: string | null;
};

type Vendor = { id: string; name: string };

export default function ItemEditForm({
  item,
  vendors,
  categories,
  types,
  units,
}: {
  item: Item;
  vendors: Vendor[];
  types: string[];
  categories: string[];
  units: string[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  const [form, setForm] = useState({
    itemNumber: item.itemNumber,
    manufacturer: item.manufacturer ?? "",
    cost: item.cost != null ? String(item.cost) : "",
    price: item.price != null ? String(item.price) : "",
    lastSoldPrice: item.lastSoldPrice != null ? String(item.lastSoldPrice) : "",
    category: item.category ?? "",
    type: item.type,
    active: item.active,
    approved: item.approved,
    eolDate: item.eolDate ?? "",
    description: item.description ?? "",
    unit: item.unit ?? "",
    preferredVendorId: item.preferredVendorId ?? "",
  });

  function set(key: keyof typeof form, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  console.log("Rendering ItemEditForm with item:", item); // Debug log
  async function handleSubmit() {
    console.log("Form values on submit:", form); // Debug log
    setSaving(true);
    try {
      console.log("Submitting item form with values:", form); // Debug log
      const res = await fetch(`/api/items/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemNumber: form.itemNumber,
          manufacturer: form.manufacturer || null,
          cost: form.cost ? parseFloat(form.cost) : null,
          price: form.price ? parseFloat(form.price) : null,
          lastSoldPrice: form.lastSoldPrice
            ? parseFloat(form.lastSoldPrice)
            : null,
          category: form.category || null,
          type: form.type,
          active: form.active,
          approved: form.approved,
          eolDate: form.eolDate || null,
          description: form.description || null,
          unit: form.unit || null,
          preferredVendorId: form.preferredVendorId || null,
        }),
      });
      if (!res.ok) throw new Error();
      showToast("success", "Item saved");
      setTimeout(() => router.push(`/items/${item.id}`), 1000);
    } catch {
      showToast("error", "Failed to save item");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium shadow-lg border ${
            toast.type === "success"
              ? "bg-white border-green-200 text-green-700"
              : "bg-white border-red-200 text-red-600"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 size={15} />
          ) : (
            <AlertCircle size={15} />
          )}
          {toast.msg}
        </div>
      )}

      <div className="space-y-4">
        {/* Identity */}
        <div className="bg-white border border-[#E5E3DE] rounded-2xl p-6 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#888]">
            Identity
          </p>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-[#999]">
              Item Number
            </label>
            <input
              value={form.itemNumber}
              onChange={(e) => set("itemNumber", e.target.value)}
              className="w-full text-sm font-mono text-[#111] border border-[#E5E3DE] rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#111] transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-[#999]">
              Manufacturer
            </label>
            <input
              value={form.manufacturer}
              onChange={(e) => set("manufacturer", e.target.value)}
              placeholder="e.g. Cisco, Sony, Crestron"
              className="w-full text-sm text-[#111] border border-[#E5E3DE] rounded-xl px-3 py-2.5 placeholder:text-[#ccc] focus:outline-none focus:border-[#111] transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-[#999]">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Brief description of the item…"
              rows={2}
              className="w-full text-sm text-[#111] border border-[#E5E3DE] rounded-xl px-3 py-2.5 placeholder:text-[#ccc] focus:outline-none focus:border-[#111] transition-colors resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-[#999]">
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                className="w-full text-sm text-[#111] border border-[#E5E3DE] rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#111] transition-colors bg-white"
              >
                <option value="">— None —</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-[#999]">
                Type
              </label>
              <select
                value={form.type}
                onChange={(e) => set("type", e.target.value)}
                className="w-full text-sm text-[#111] border border-[#E5E3DE] rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#111] transition-colors bg-white"
              >
                {types.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-[#999]">
              Default Vendor
            </label>
            <select
              value={form.preferredVendorId}
              onChange={(e) => set("preferredVendorId", e.target.value)}
              className="w-full text-sm text-[#111] border border-[#E5E3DE] rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#111] transition-colors bg-white"
            >
              <option value="">— None —</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white border border-[#E5E3DE] rounded-2xl p-6 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#888]">
            Pricing
          </p>

          <div className="grid grid-cols-2 gap-4">
            {[
              { key: "cost" as const, label: "Cost" },
              { key: "price" as const, label: "List Price" },
            ].map(({ key, label }) => (
              <div key={key} className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-[#999]">
                  {label}
                </label>
                <div className="flex items-center gap-1">
                  <span className="text-sm text-[#999]">$</span>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={form[key]}
                    onChange={(e) => set(key, e.target.value)}
                    placeholder="0.00"
                    className="w-full text-sm text-[#111] border border-[#E5E3DE] rounded-xl px-3 py-2.5 placeholder:text-[#ccc] focus:outline-none focus:border-[#111] transition-colors"
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-[#999]">
              Unit
            </label>
            <select
              value={form.unit}
              onChange={(e) => set("unit", e.target.value)}
              className="w-full text-sm text-[#111] border border-[#E5E3DE] rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#111] transition-colors bg-white"
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

        {/* Status */}
        <div className="bg-white border border-[#E5E3DE] rounded-2xl p-6 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#888]">
            Status
          </p>

          <div className="grid grid-cols-2 gap-4">
            {[
              {
                key: "active" as const,
                label: "Active",
                description: "Item is available for use in BOMs and quotes",
              },
              {
                key: "approved" as const,
                label: "Approved",
                description: "Item has been approved for sale",
              },
            ].map(({ key, label, description }) => (
              <button
                key={key}
                type="button"
                onClick={() => set(key, !form[key])}
                className={`text-left p-4 rounded-xl border-2 transition-all ${
                  form[key]
                    ? "border-[#111] bg-[#111]"
                    : "border-[#E5E3DE] bg-white hover:border-[#ccc]"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-sm font-semibold ${form[key] ? "text-white" : "text-[#111]"}`}
                  >
                    {label}
                  </span>
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      form[key] ? "border-white bg-white" : "border-[#ccc]"
                    }`}
                  >
                    {form[key] && (
                      <div className="w-2 h-2 rounded-full bg-[#111]" />
                    )}
                  </div>
                </div>
                <p
                  className={`text-xs ${form[key] ? "text-white/60" : "text-[#999]"}`}
                >
                  {description}
                </p>
              </button>
            ))}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-[#999]">
              EOL Date{" "}
              <span className="normal-case font-normal text-[#bbb] tracking-normal">
                (optional)
              </span>
            </label>
            <input
              type="date"
              value={form.eolDate}
              onChange={(e) => set("eolDate", e.target.value)}
              className="w-full text-sm text-[#111] border border-[#E5E3DE] rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#111] transition-colors"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 text-sm font-semibold px-4 py-3 rounded-xl bg-[#111] text-white hover:bg-[#333] disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={() => router.push(`/items/${item.id}`)}
            className="flex-1 text-sm font-semibold px-4 py-3 rounded-xl border border-[#E5E3DE] bg-white hover:bg-[#F7F6F3] transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}
