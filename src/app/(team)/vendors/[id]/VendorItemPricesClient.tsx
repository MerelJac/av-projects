"use client";
import { useState } from "react";
import { Plus, Trash2, Pencil, Check, X, Upload } from "lucide-react";
import Link from "next/link";

type ItemSnippet = {
  id: string;
  itemNumber: string;
  manufacturer: string | null;
  description: string | null;
};

type VendorPrice = {
  id: string;
  itemId: string;
  item: ItemSnippet;
  cost: number;
  leadTimeDays: number | null;
  notes: string | null;
};

export default function VendorItemPricesClient({
  vendorId,
  initialPrices,
}: {
  vendorId: string;
  initialPrices: VendorPrice[];
}) {
  const [prices, setPrices] = useState<VendorPrice[]>(initialPrices);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCost, setEditCost] = useState("");
  const [editLeadTime, setEditLeadTime] = useState("");
  const [editNotes, setEditNotes] = useState("");

  // New price form
  const [showAdd, setShowAdd] = useState(false);
  const [newItemSearch, setNewItemSearch] = useState("");
  const [newItemResults, setNewItemResults] = useState<ItemSnippet[]>([]);
  const [newItem, setNewItem] = useState<ItemSnippet | null>(null);
  const [newCost, setNewCost] = useState("");
  const [newLeadTime, setNewLeadTime] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function searchItems(q: string) {
    setNewItemSearch(q);
    if (q.trim().length < 2) {
      setNewItemResults([]);
      return;
    }
    const res = await fetch(`/api/items?q=${encodeURIComponent(q)}&limit=10`);
    if (res.ok) setNewItemResults(await res.json());
  }

  async function handleAdd() {
    if (!newItem || !newCost) {
      setError("Item and cost are required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/vendors/${vendorId}/item-prices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: newItem.id,
          cost: parseFloat(newCost),
          leadTimeDays: newLeadTime ? parseInt(newLeadTime) : null,
          notes: newNotes || null,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const created: VendorPrice = await res.json();
      setPrices((prev) => {
        const idx = prev.findIndex((p) => p.id === created.id);
        return idx >= 0
          ? prev.map((p) => (p.id === created.id ? created : p))
          : [created, ...prev];
      });
      setShowAdd(false);
      setNewItem(null);
      setNewItemSearch("");
      setNewCost("");
      setNewLeadTime("");
      setNewNotes("");
    } catch {
      setError("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(p: VendorPrice) {
    setEditingId(p.id);
    setEditCost(String(p.cost));
    setEditLeadTime(p.leadTimeDays != null ? String(p.leadTimeDays) : "");
    setEditNotes(p.notes ?? "");
  }

  async function handleSaveEdit(id: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/vendors/${vendorId}/item-prices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cost: parseFloat(editCost),
          leadTimeDays: editLeadTime ? parseInt(editLeadTime) : null,
          notes: editNotes || null,
        }),
      });
      if (!res.ok) throw new Error();
      const updated: VendorPrice = await res.json();
      setPrices((prev) => prev.map((p) => (p.id === id ? updated : p)));
      setEditingId(null);
    } catch {
      setError("Failed to update");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await fetch(`/api/vendors/${vendorId}/item-prices/${id}`, {
        method: "DELETE",
      });
      setPrices((prev) => prev.filter((p) => p.id !== id));
    } catch {
      setError("Failed to delete");
    }
  }

  return (
    <div className="bg-white border border-[#E5E3DE] rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-[#F0EEE9] flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-[#111]">Item Pricing</h2>
          <p className="text-xs text-[#999] mt-0.5">
            Default costs used when this vendor is selected on a PO
          </p>
        </div>
        <div className="flex flex-row gap-2 items-center justify-between">
          <Link
            href={`/vendors/${vendorId}/import-prices`}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#666] hover:text-[#111] px-3 py-1.5 rounded-lg hover:bg-white transition-colors border border-[#E5E3DE]"
          >
            <Upload size={14} />
            Import CSV Price Lists
          </Link>

          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 text-xs font-semibold bg-[#111] text-white px-3 py-1.5 rounded-lg hover:bg-[#333] transition-colors"
          >
            <Plus size={12} />
            Add Item Price
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="px-6 py-5 border-b border-[#F0EEE9] bg-[#FAFAF8] space-y-3">
          <p className="text-xs font-semibold text-[#888] uppercase tracking-widest">
            Add item price
          </p>

          {/* Item search */}
          <div className="relative">
            {newItem ? (
              <div className="flex items-center justify-between px-3 py-2 border border-[#E5E3DE] rounded-xl bg-white">
                <div>
                  <span className="text-sm font-medium text-[#111]">
                    {newItem.itemNumber}
                  </span>
                  {newItem.manufacturer && (
                    <span className="text-xs text-[#999] ml-2">
                      {newItem.manufacturer}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => {
                    setNewItem(null);
                    setNewItemSearch("");
                  }}
                  className="text-[#bbb] hover:text-[#666]"
                >
                  <X size={13} />
                </button>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  placeholder="Search by item number…"
                  value={newItemSearch}
                  onChange={(e) => searchItems(e.target.value)}
                  className="w-full text-sm border border-[#E5E3DE] rounded-xl px-3 py-2 focus:outline-none focus:border-[#111]"
                />
                {newItemResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E5E3DE] rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
                    {newItemResults.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setNewItem(item);
                          setNewItemResults([]);
                          setNewItemSearch("");
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-[#F7F6F3] transition-colors"
                      >
                        <p className="text-sm font-medium text-[#111]">
                          {item.itemNumber}
                        </p>
                        {item.manufacturer && (
                          <p className="text-xs text-[#999]">
                            {item.manufacturer}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#888] uppercase tracking-widest block mb-1">
                Cost / MSRP
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#999]">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newCost}
                  onChange={(e) => setNewCost(e.target.value)}
                  placeholder="0.00"
                  className="w-full text-sm border border-[#E5E3DE] rounded-xl pl-6 pr-3 py-2 focus:outline-none focus:border-[#111]"
                />
              </div>
            </div>
            {/* <div>
              <label className="text-xs font-semibold text-[#888] uppercase tracking-widest block mb-1">Lead Time (days)</label>
              <input
                type="number"
                min="0"
                value={newLeadTime}
                onChange={(e) => setNewLeadTime(e.target.value)}
                placeholder="—"
                className="w-full text-sm border border-[#E5E3DE] rounded-xl px-3 py-2 focus:outline-none focus:border-[#111]"
              />
            </div> */}
            <div>
              <label className="text-xs font-semibold text-[#888] uppercase tracking-widest block mb-1">
                Notes
              </label>
              <input
                type="text"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="Optional"
                className="w-full text-sm border border-[#E5E3DE] rounded-xl px-3 py-2 focus:outline-none focus:border-[#111]"
              />
            </div>
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleAdd}
              disabled={saving || !newItem || !newCost}
              className="flex items-center gap-2 bg-[#111] text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-[#333] disabled:opacity-40 transition-colors"
            >
              {saving ? "Saving…" : "Save Price"}
            </button>
            <button
              onClick={() => {
                setShowAdd(false);
                setNewItem(null);
                setNewItemSearch("");
                setNewCost("");
                setNewLeadTime("");
                setNewNotes("");
                setError(null);
              }}
              className="text-sm text-[#999] hover:text-[#111] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {prices.length === 0 && !showAdd ? (
        <p className="px-6 py-10 text-sm text-[#bbb] text-center">
          No item prices yet
        </p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#F0EEE9] bg-[#FAFAF8]">
              <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-[#999] px-6 py-3">
                Item
              </th>
              <th className="text-right text-[10px] font-semibold uppercase tracking-widest text-[#999] px-4 py-3 w-28">
                Cost
              </th>
              {/* <th className="text-right text-[10px] font-semibold uppercase tracking-widest text-[#999] px-4 py-3 w-28">Lead Time</th> */}
              <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-[#999] px-4 py-3">
                Notes
              </th>
              <th className="w-20" />
            </tr>
          </thead>
          <tbody>
            {prices.map((p) => {
              const isEditing = editingId === p.id;
              return (
                <tr
                  key={p.id}
                  className="border-b border-[#F7F6F3] last:border-0"
                >
                  <td className="px-6 py-3">
                    <p className="font-medium text-[#111]">
                      {p.item.itemNumber}
                    </p>
                    {p.item.manufacturer && (
                      <p className="text-xs text-[#999]">
                        {p.item.manufacturer}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {isEditing ? (
                      <div className="relative inline-flex">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-[#999]">
                          $
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          value={editCost}
                          onChange={(e) => setEditCost(e.target.value)}
                          className="w-24 text-right text-sm border border-[#E5E3DE] rounded-lg pl-5 pr-2 py-1 focus:outline-none focus:border-[#111]"
                        />
                      </div>
                    ) : (
                      <span className="text-[#111] font-medium">
                        $
                        {p.cost.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    )}
                  </td>
                  {/* <td className="px-4 py-3 text-right">
                    {isEditing ? (
                      <input
                        type="number"
                        min="0"
                        value={editLeadTime}
                        onChange={(e) => setEditLeadTime(e.target.value)}
                        placeholder="—"
                        className="w-30 text-right text-sm border border-[#E5E3DE] rounded-lg px-2 py-1 focus:outline-none focus:border-[#111]"
                      />
                    ) : (
                      <span className="text-[#666]">{p.leadTimeDays != null ? `${p.leadTimeDays}d` : "—"}</span>
                    )}
                  </td> */}
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        placeholder="Optional"
                        className="w-full text-sm border border-[#E5E3DE] rounded-lg px-2 py-1 focus:outline-none focus:border-[#111]"
                      />
                    ) : (
                      <span className="text-[#666]">{p.notes ?? "—"}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => handleSaveEdit(p.id)}
                            disabled={saving}
                            className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 transition-colors"
                          >
                            <Check size={13} />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1.5 rounded-lg hover:bg-[#F0EEE9] text-[#999] transition-colors"
                          >
                            <X size={13} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(p)}
                            className="p-1.5 rounded-lg hover:bg-[#F0EEE9] text-[#999] hover:text-[#111] transition-colors"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-[#999] hover:text-red-600 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
