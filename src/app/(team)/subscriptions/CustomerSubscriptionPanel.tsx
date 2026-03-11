"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, X, AlertCircle, RefreshCw, CheckCircle2, Clock } from "lucide-react";

type Item = { id: string; itemNumber: string; manufacturer: string | null; price: number | null; category: string | null };
type Subscription = {
  id: string;
  itemId: string;
  item: Item;
  startDate: string | Date;
  endDate: string | Date;
  status: "ACTIVE" | "PENDING_RENEWAL" | "EXPIRED";
  notes: string | null;
};

const STATUS_STYLES = {
  ACTIVE: "bg-green-50 text-green-700",
  PENDING_RENEWAL: "bg-amber-50 text-amber-700",
  EXPIRED: "bg-red-50 text-red-600",
};

const STATUS_ICONS = {
  ACTIVE: CheckCircle2,
  PENDING_RENEWAL: RefreshCw,
  EXPIRED: Clock,
};

function daysUntil(date: string | Date) {
  return Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function fmtDate(d: string | Date) {
  return new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function SubForm({
  customerId,
  availableItems,
  existing,
  onSave,
  onCancel,
}: {
  customerId: string;
  availableItems: Item[];
  existing?: Subscription;
  onSave: (sub: Subscription) => void;
  onCancel: () => void;
}) {
  const [itemId, setItemId] = useState(existing?.itemId ?? availableItems[0]?.id ?? "");
  const [startDate, setStartDate] = useState(
    existing ? new Date(existing.startDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)
  );
  const [endDate, setEndDate] = useState(
    existing ? new Date(existing.endDate).toISOString().slice(0, 10) : ""
  );
  const [status, setStatus] = useState<Subscription["status"]>(existing?.status ?? "ACTIVE");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!itemId || !startDate || !endDate) {
      setError("Item, start date, and end date are required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const url = existing
        ? `/api/customers/${customerId}/subscriptions/${existing.id}`
        : `/api/customers/${customerId}/subscriptions`;
      const res = await fetch(url, {
        method: existing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, startDate, endDate, status, notes }),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error ?? "Failed to save");
      }
      onSave(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="px-5 py-4 bg-[#FAFAF9] border-b border-[#F0EEE9] space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="text-[10px] font-semibold uppercase tracking-widest text-[#999] mb-1 block">Item</label>
          <select
            value={itemId}
            onChange={e => setItemId(e.target.value)}
            className="w-full text-sm border border-[#E5E3DE] rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-[#111]"
          >
            {availableItems.map(item => (
              <option key={item.id} value={item.id}>
                {item.itemNumber}{item.manufacturer ? ` — ${item.manufacturer}` : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-widest text-[#999] mb-1 block">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="w-full text-sm border border-[#E5E3DE] rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-[#111]"
          />
        </div>
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-widest text-[#999] mb-1 block">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="w-full text-sm border border-[#E5E3DE] rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-[#111]"
          />
        </div>
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-widest text-[#999] mb-1 block">Status</label>
          <select
            value={status}
            onChange={e => setStatus(e.target.value as Subscription["status"])}
            className="w-full text-sm border border-[#E5E3DE] rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-[#111]"
          >
            <option value="ACTIVE">Active</option>
            <option value="PENDING_RENEWAL">Pending Renewal</option>
            <option value="EXPIRED">Expired</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-widest text-[#999] mb-1 block">Notes</label>
          <input
            type="text"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Optional notes…"
            className="w-full text-sm border border-[#E5E3DE] rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-[#111]"
          />
        </div>
      </div>
      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1.5">
          <AlertCircle size={11} /> {error}
        </p>
      )}
      <div className="flex items-center gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-sm font-semibold px-4 py-2 rounded-xl bg-[#111] text-white hover:bg-[#333] disabled:opacity-40 transition-colors"
        >
          {saving ? "Saving…" : existing ? "Save Changes" : "Add Subscription"}
        </button>
        <button onClick={onCancel} className="text-[#999] hover:text-[#111] p-2">
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

export default function CustomerSubscriptionsPanel({
  customerId,
  initialSubscriptions,
  availableItems,
}: {
  customerId: string;
  initialSubscriptions: Subscription[];
  availableItems: Item[];
}) {
  const router = useRouter();
  const [subs, setSubs] = useState<Subscription[]>(initialSubscriptions);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    await fetch(`/api/customers/${customerId}/subscriptions/${id}`, { method: "DELETE" });
    setSubs(s => s.filter(sub => sub.id !== id));
    router.refresh();
  }

  function handleSaved(sub: Subscription) {
    setSubs(s => {
      const idx = s.findIndex(x => x.id === sub.id);
      if (idx >= 0) { const n = [...s]; n[idx] = sub; return n; }
      return [...s, sub];
    });
    setShowAdd(false);
    setEditingId(null);
    router.refresh();
  }

  const active = subs.filter(s => s.status === "ACTIVE").length;
  const expiringSoon = subs.filter(s => {
    const days = daysUntil(s.endDate);
    return s.status === "ACTIVE" && days >= 0 && days <= 30;
  }).length;

  return (
    <div className="bg-white border border-[#E5E3DE] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#F0EEE9] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-bold text-[#111]">Subscriptions</h3>
          {subs.length > 0 && (
            <span className="text-xs text-[#bbb]">{active} active</span>
          )}
          {expiringSoon > 0 && (
            <span className="text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-full">
              {expiringSoon} expiring soon
            </span>
          )}
        </div>
        {availableItems.length > 0 && (
          <button
            onClick={() => { setShowAdd(true); setEditingId(null); }}
            className="flex items-center gap-1.5 text-xs font-semibold bg-[#111] text-white px-3 py-1.5 rounded-lg hover:bg-[#333] transition-colors"
          >
            <Plus size={11} /> Add
          </button>
        )}
      </div>

      {/* Add form */}
      {showAdd && (
        <SubForm
          customerId={customerId}
          availableItems={availableItems}
          onSave={handleSaved}
          onCancel={() => setShowAdd(false)}
        />
      )}

      {subs.length === 0 && !showAdd ? (
        <div className="px-5 py-10 text-center">
          <p className="text-sm text-[#bbb]">No subscriptions yet</p>
        </div>
      ) : (
        <div className="divide-y divide-[#F7F6F3]">
          {subs.map(sub => {
            const days = daysUntil(sub.endDate);
            const StatusIcon = STATUS_ICONS[sub.status];
            const isExpiringSoon = sub.status === "ACTIVE" && days >= 0 && days <= 30;

            if (editingId === sub.id) {
              return (
                <SubForm
                  key={sub.id}
                  customerId={customerId}
                  availableItems={availableItems}
                  existing={sub}
                  onSave={handleSaved}
                  onCancel={() => setEditingId(null)}
                />
              );
            }

            return (
              <div key={sub.id} className={`px-5 py-4 flex items-start justify-between gap-4 group hover:bg-[#FAFAF9] transition-colors ${isExpiringSoon ? "border-l-2 border-amber-400" : ""}`}>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-[#111] font-mono">{sub.item.itemNumber}</span>
                    {sub.item.manufacturer && (
                      <span className="text-xs text-[#888]">{sub.item.manufacturer}</span>
                    )}
                    <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLES[sub.status]}`}>
                      <StatusIcon size={9} />
                      {sub.status.replace("_", " ")}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-[#888]">
                    <span>{fmtDate(sub.startDate)} → {fmtDate(sub.endDate)}</span>
                    {sub.item.price != null && (
                      <span className="font-semibold text-[#555]">
                        ${sub.item.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}/yr
                      </span>
                    )}
                  </div>
                  {isExpiringSoon && (
                    <p className="text-[11px] font-semibold text-amber-600 mt-1">
                      Expires in {days} day{days !== 1 ? "s" : ""}
                    </p>
                  )}
                  {sub.status === "EXPIRED" && (
                    <p className="text-[11px] font-semibold text-red-500 mt-1">
                      Expired {Math.abs(days)} day{Math.abs(days) !== 1 ? "s" : ""} ago
                    </p>
                  )}
                  {sub.notes && (
                    <p className="text-[11px] text-[#aaa] mt-1 italic">{sub.notes}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    onClick={() => { setEditingId(sub.id); setShowAdd(false); }}
                    className="p-1.5 rounded-lg text-[#999] hover:text-[#111] hover:bg-[#F0EEE9] transition-colors"
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    onClick={() => handleDelete(sub.id)}
                    className="p-1.5 rounded-lg text-[#999] hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}