"use client";
// src/app/components/PurchaseOrdersPanel.tsx
import { useState } from "react";
import {
  Package,
  Truck,
  Plus,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  Send,
  X,
} from "lucide-react";
import { POWithDetails } from "@/types/purchaseOrder";
import Link from "next/link";

type Item = { id: string; itemNumber: string; manufacturer: string | null };

type POLine = {
  id: string;
  itemId: string;
  item: Item;
  quantity: number;
  receivedQuantity: number;
  cost: number;
  salesOrderLineId: string | null;
};

type Shipment = {
  id: string;
  itemId: string | null;
  item: Item | null;
  quantity: number;
  carrier: string | null;
  tracking: string | null;
  shippedBy: string | null;
  notes: string | null;
  receivedAt: string | null;
  createdAt: string;
};

type PO = {
  id: string;
  vendor: string;
  status: "DRAFT" | "SENT" | "PARTIALLY_RECEIVED" | "RECEIVED";
  notes: string | null;
  createdAt: string;
  lines: POLine[];
  shipments: Shipment[];
};

type SOLine = {
  id: string;
  description: string;
  quantity: number;
  itemId: string | null;
  item: Item | null;
};

const PO_STATUS: Record<
  PO["status"],
  { label: string; color: string; icon: React.ReactNode }
> = {
  DRAFT: {
    label: "Draft",
    color: "text-gray-500 bg-gray-100",
    icon: <Clock size={11} />,
  },
  SENT: {
    label: "Sent to Vendor",
    color: "text-blue-600 bg-blue-50",
    icon: <Send size={11} />,
  },
  PARTIALLY_RECEIVED: {
    label: "Partial",
    color: "text-amber-600 bg-amber-50",
    icon: <AlertCircle size={11} />,
  },
  RECEIVED: {
    label: "Received",
    color: "text-green-600 bg-green-50",
    icon: <CheckCircle2 size={11} />,
  },
};

export default function PurchaseOrdersPanel({
  projectId,
  salesOrderId,
  salesOrderLines,
  initialPOs,
}: {
  projectId: string;
  salesOrderId: string;
  salesOrderLines: SOLine[];
  initialPOs: POWithDetails[];
}) {
  const [pos, setPOs] = useState<POWithDetails[]>(initialPOs);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showNewPO, setShowNewPO] = useState(false);

  function togglePO(id: string) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  async function refreshPOs() {
    const res = await fetch(
      `/api/projects/${projectId}/sales-orders/${salesOrderId}/purchase-orders`,
    );
    if (res.ok) setPOs(await res.json());
  }

  async function markSent(poId: string) {
    await fetch(
      `/api/projects/${projectId}/sales-orders/${salesOrderId}/purchase-orders/${poId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "SENT" }),
      },
    );
    await refreshPOs();
  }

  const totalLines = salesOrderLines.length;
  const receivedLines = pos
    .flatMap((po) => po.lines)
    .filter((l) => l.receivedQuantity >= l.quantity).length;

  return (
    <div className="bg-white border border-[#E5E3DE] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-[#F0EEE9] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package size={14} className="text-[#999]" />
          <h3 className="text-sm font-semibold text-[#111]">Purchase Orders</h3>
          {pos.length > 0 && (
            <span className="text-xs text-[#bbb]">
              {pos.length} PO{pos.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {pos.length > 0 && (
            <span className="text-xs text-[#999]">
              {receivedLines}/{totalLines} lines received
            </span>
          )}
          <button
            onClick={() => setShowNewPO(true)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#111] text-white hover:bg-[#333] transition-colors"
          >
            <Plus size={11} />
            New PO
          </button>
        </div>
      </div>

      {/* PO list */}
      {pos.length === 0 && !showNewPO && (
        <p className="px-5 py-8 text-sm text-[#bbb] text-center">
          No purchase orders yet — create one to start fulfilling this sales
          order
        </p>
      )}

      <div className="divide-y divide-[#F7F6F3]">
        {pos.map((po) => (
          <PORow
            key={po.id}
            po={po}
            projectId={projectId}
            salesOrderId={salesOrderId}
            expanded={!!expanded[po.id]}
            onToggle={() => togglePO(po.id)}
            onMarkSent={() => markSent(po.id)}
            onRefresh={refreshPOs}
          />
        ))}
      </div>

      {/* New PO form */}
      {showNewPO && (
        <NewPOForm
          projectId={projectId}
          salesOrderId={salesOrderId}
          salesOrderLines={salesOrderLines}
          onCreated={async () => {
            await refreshPOs();
            setShowNewPO(false);
          }}
          onCancel={() => setShowNewPO(false)}
        />
      )}
    </div>
  );
}

// ─── PO Row ───────────────────────────────────────────────────────────────────
function PORow({
  po,
  projectId,
  salesOrderId,
  expanded,
  onToggle,
  onMarkSent,
  onRefresh,
}: {
  po: POWithDetails;
  projectId: string;
  salesOrderId: string;
  expanded: boolean;
  onToggle: () => void;
  onMarkSent: () => void;
  onRefresh: () => void;
}) {
  const cfg = PO_STATUS[po.status];
  const [showLogShipment, setShowLogShipment] = useState(false);

  return (
    <div>
      {/* PO header row */}
      <div
        className="px-5 py-3.5 flex items-center gap-3 cursor-pointer hover:bg-[#FAFAF9] transition-colors"
        onClick={onToggle}
      >
        <span className="text-[#ccc]">
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[#111]">
              {po.vendor}
            </span>
            <span
              className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}
            >
              {cfg.icon}
              {cfg.label}
            </span>
          </div>
          <p className="text-[10px] text-[#bbb] mt-0.5">
            {po.lines.length} item{po.lines.length !== 1 ? "s" : ""} ·{" "}
            {po.lines.reduce((s, l) => s + l.receivedQuantity, 0)}/
            {po.lines.reduce((s, l) => s + l.quantity, 0)} received ·{" "}
            {new Date(po.createdAt).toLocaleDateString()}
          </p>
        </div>
        <Link
          href={`/projects/${projectId}/sales-orders/${salesOrderId}/purchase-orders/${po.id}`}
          className="text-sm font-semibold text-[#111] hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {po.vendor}
        </Link>
        <div
          className="flex items-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          {po.status === "DRAFT" && (
            <button
              onClick={onMarkSent}
              className="text-xs font-medium px-2.5 py-1 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors"
            >
              Mark Sent
            </button>
          )}

          {(po.status === "SENT" || po.status === "PARTIALLY_RECEIVED") && (
            <button
              onClick={() => setShowLogShipment(true)}
              className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg border border-[#E5E3DE] text-[#111] hover:bg-[#F7F6F3] transition-colors"
            >
              <Truck size={11} />
              Log Shipment
            </button>
          )}
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="bg-[#FAFAF9] border-t border-[#F0EEE9]">
          {/* Lines */}
          <div className="px-5 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#999] mb-2">
              Items
            </p>
            <div className="space-y-1.5">
              {po.lines.map((line) => {
                const pct =
                  line.quantity > 0
                    ? (line.receivedQuantity / line.quantity) * 100
                    : 0;
                return (
                  <div key={line.id} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <span className="text-xs text-[#111] font-mono">
                        {line.item.itemNumber}
                      </span>
                      {line.item.manufacturer && (
                        <span className="text-[10px] text-[#999] ml-2">
                          {line.item.manufacturer}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#666]">
                      <span>
                        {line.receivedQuantity}/{line.quantity}
                      </span>
                      <div className="w-16 h-1.5 bg-[#E5E3DE] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${pct >= 100 ? "bg-green-500" : pct > 0 ? "bg-amber-400" : "bg-[#E5E3DE]"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Shipments */}
          {po.shipments.length > 0 && (
            <div className="px-5 pb-3 border-t border-[#F0EEE9] pt-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#999] mb-2">
                Shipments
              </p>
              <div className="space-y-2">
                {po.shipments.map((s) => (
                  <div
                    key={s.id}
                    className="text-xs text-[#444] flex items-start gap-3"
                  >
                    <Truck
                      size={11}
                      className="mt-0.5 text-[#999] flex-shrink-0"
                    />
                    <div>
                      <span className="font-semibold">
                        {s.item?.itemNumber ?? "Item"} × {s.quantity}
                      </span>
                      {s.carrier && (
                        <span className="text-[#999] ml-2">{s.carrier}</span>
                      )}
                      {s.tracking && (
                        <span className="ml-2 font-mono text-[#666]">
                          {s.tracking}
                        </span>
                      )}
                      {s.receivedAt && (
                        <span className="ml-2 text-green-600">
                          ✓ Received{" "}
                          {new Date(s.receivedAt).toLocaleDateString()}
                        </span>
                      )}
                      {s.notes && (
                        <p className="text-[#999] mt-0.5">{s.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {po.notes && (
            <div className="px-5 pb-3">
              <p className="text-xs text-[#999] italic">{po.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Log Shipment modal */}
      {showLogShipment && (
        <LogShipmentForm
          po={po}
          projectId={projectId}
          salesOrderId={salesOrderId}
          onSaved={async () => {
            await onRefresh();
            setShowLogShipment(false);
          }}
          onCancel={() => setShowLogShipment(false)}
        />
      )}
    </div>
  );
}

// ─── Log Shipment Form ────────────────────────────────────────────────────────
function LogShipmentForm({
  po,
  projectId,
  salesOrderId,
  onSaved,
  onCancel,
}: {
  po: POWithDetails;
  projectId: string;
  salesOrderId: string;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [itemId, setItemId] = useState(po.lines[0]?.itemId ?? "");
  const [quantity, setQuantity] = useState(1);
  const [carrier, setCarrier] = useState("");
  const [tracking, setTracking] = useState("");
  const [shippedBy, setShippedBy] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/sales-orders/${salesOrderId}/purchase-orders/${po.id}/shipments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            itemId: itemId || null,
            quantity,
            carrier: carrier || null,
            tracking: tracking || null,
            shippedBy: shippedBy || null,
            notes: notes || null,
            receivedAt: new Date().toISOString(), // log as received now
          }),
        },
      );
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        setError(b?.error ?? "Failed to log shipment");
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="px-6 py-4 border-b border-[#F0EEE9] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#111]">Log Shipment</h3>
          <button onClick={onCancel} className="text-[#999] hover:text-[#111]">
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-4 space-y-3">
          <div>
            <label className="text-xs font-semibold text-[#666] block mb-1">
              Item
            </label>
            <select
              value={itemId}
              onChange={(e) => setItemId(e.target.value)}
              className="w-full text-sm border border-[#E5E3DE] rounded-xl px-3 py-2 focus:outline-none focus:border-[#111]"
            >
              <option value="">— All items / unspecified —</option>
              {po.lines.map((l) => (
                <option key={l.itemId} value={l.itemId}>
                  {l.item.itemNumber} (ordered: {l.quantity}, received:{" "}
                  {l.receivedQuantity})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-[#666] block mb-1">
              Quantity Received
            </label>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              className="w-full text-sm border border-[#E5E3DE] rounded-xl px-3 py-2 focus:outline-none focus:border-[#111]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#666] block mb-1">
                Carrier
              </label>
              <input
                type="text"
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                placeholder="UPS, FedEx…"
                className="w-full text-sm border border-[#E5E3DE] rounded-xl px-3 py-2 focus:outline-none focus:border-[#111]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#666] block mb-1">
                Tracking #
              </label>
              <input
                type="text"
                value={tracking}
                onChange={(e) => setTracking(e.target.value)}
                placeholder="1Z…"
                className="w-full text-sm border border-[#E5E3DE] rounded-xl px-3 py-2 focus:outline-none focus:border-[#111]"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-[#666] block mb-1">
              Shipped By
            </label>
            <input
              type="text"
              value={shippedBy}
              onChange={(e) => setShippedBy(e.target.value)}
              placeholder="Vendor name or rep"
              className="w-full text-sm border border-[#E5E3DE] rounded-xl px-3 py-2 focus:outline-none focus:border-[#111]"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#666] block mb-1">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Partial shipment, damage, etc."
              className="w-full text-sm border border-[#E5E3DE] rounded-xl px-3 py-2 focus:outline-none focus:border-[#111] resize-none"
            />
          </div>
          {error && (
            <p className="text-xs text-red-600 flex items-center gap-1.5">
              <AlertCircle size={11} /> {error}
            </p>
          )}
        </div>
        <div className="px-6 py-4 border-t border-[#F0EEE9] flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="text-sm text-[#666] hover:text-[#111]"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-sm font-semibold px-4 py-2 rounded-xl bg-[#111] text-white hover:bg-[#333] disabled:opacity-40 transition-colors"
          >
            {saving ? "Saving…" : "Log Shipment"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── New PO Form ──────────────────────────────────────────────────────────────
function NewPOForm({
  projectId,
  salesOrderId,
  salesOrderLines,
  onCreated,
  onCancel,
}: {
  projectId: string;
  salesOrderId: string;
  salesOrderLines: SOLine[];
  onCreated: () => void;
  onCancel: () => void;
}) {
  const [vendor, setVendor] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedLines, setSelectedLines] = useState<
    Record<string, { selected: boolean; quantity: number; cost: string }>
  >(
    Object.fromEntries(
      salesOrderLines
        .filter((l) => l.itemId)
        .map((l) => [l.id, { selected: true, quantity: l.quantity, cost: "" }]),
    ),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    setSaving(true);
    setError(null);
    const lines = salesOrderLines
      .filter((l) => l.itemId && selectedLines[l.id]?.selected)
      .map((l) => ({
        itemId: l.itemId!,
        salesOrderLineId: l.id,
        quantity: selectedLines[l.id].quantity,
        cost: parseFloat(selectedLines[l.id].cost) || 0,
      }));

    if (!vendor.trim()) {
      setError("Vendor is required");
      setSaving(false);
      return;
    }
    if (!lines.length) {
      setError("Select at least one item");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch(
        `/api/projects/${projectId}/sales-orders/${salesOrderId}/purchase-orders`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vendor, notes, lines }),
        },
      );
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        setError(b?.error ?? "Failed to create PO");
        return;
      }
      onCreated();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  const itemLines = salesOrderLines.filter((l) => l.itemId);

  return (
    <div className="border-t border-[#F0EEE9] p-5 bg-[#FAFAF9]">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-[#111]">New Purchase Order</p>
        <button onClick={onCancel} className="text-[#999] hover:text-[#111]">
          <X size={14} />
        </button>
      </div>
      <div className="space-y-3">
        <div>
          <label className="text-xs font-semibold text-[#666] block mb-1">
            Vendor *
          </label>
          <input
            type="text"
            value={vendor}
            onChange={(e) => setVendor(e.target.value)}
            placeholder="Vendor name"
            className="w-full text-sm border border-[#E5E3DE] rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-[#111]"
            autoFocus
          />
        </div>

        {itemLines.length > 0 && (
          <div>
            <label className="text-xs font-semibold text-[#666] block mb-2">
              Items to Order
            </label>
            <div className="space-y-2">
              {itemLines.map((l) => {
                const state = selectedLines[l.id];
                return (
                  <div
                    key={l.id}
                    className="flex items-center gap-3 bg-white rounded-xl border border-[#E5E3DE] px-3 py-2"
                  >
                    <input
                      type="checkbox"
                      checked={state?.selected ?? false}
                      onChange={(e) =>
                        setSelectedLines((prev) => ({
                          ...prev,
                          [l.id]: { ...prev[l.id], selected: e.target.checked },
                        }))
                      }
                      className="rounded"
                    />
                    <span className="flex-1 text-xs font-mono text-[#111]">
                      {l.item?.itemNumber ?? l.description}
                    </span>
                    <input
                      type="number"
                      min={1}
                      value={state?.quantity ?? l.quantity}
                      onChange={(e) =>
                        setSelectedLines((prev) => ({
                          ...prev,
                          [l.id]: {
                            ...prev[l.id],
                            quantity: parseInt(e.target.value) || 1,
                          },
                        }))
                      }
                      className="w-14 text-right text-xs border border-[#E5E3DE] rounded-lg px-2 py-1 focus:outline-none"
                      title="Quantity"
                    />
                    <div className="flex items-center gap-0.5">
                      <span className="text-[10px] text-[#999]">$</span>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={state?.cost ?? ""}
                        onChange={(e) =>
                          setSelectedLines((prev) => ({
                            ...prev,
                            [l.id]: { ...prev[l.id], cost: e.target.value },
                          }))
                        }
                        placeholder="Cost"
                        className="w-20 text-right text-xs border border-[#E5E3DE] rounded-lg px-2 py-1 focus:outline-none"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <label className="text-xs font-semibold text-[#666] block mb-1">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Any notes for this PO…"
            className="w-full text-sm border border-[#E5E3DE] rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-[#111] resize-none"
          />
        </div>

        {error && (
          <p className="text-xs text-red-600 flex items-center gap-1.5">
            <AlertCircle size={11} /> {error}
          </p>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <button
            onClick={onCancel}
            className="text-sm text-[#666] hover:text-[#111]"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={saving}
            className="text-sm font-semibold px-4 py-2 rounded-xl bg-[#111] text-white hover:bg-[#333] disabled:opacity-40 transition-colors"
          >
            {saving ? "Creating…" : "Create PO"}
          </button>
        </div>
      </div>
    </div>
  );
}
