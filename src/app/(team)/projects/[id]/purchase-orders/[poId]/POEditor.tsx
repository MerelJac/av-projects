"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Truck, CheckCircle2, AlertCircle, Plus, Clock, Send, Pencil, Trash2, Search } from "lucide-react";

type POLine = {
  id: string;
  itemId: string | null;
  quantity: number;
  receivedQuantity: number;
  cost: number;
  costOverridden: boolean;
  item: {
    id: string;
    itemNumber: string;
    manufacturer: string | null;
    description: string | null;
  } | null;
};

type ShipmentLine = {
  id: string;
  quantity: number;
  poLineId: string | null;
  item: { id: string; itemNumber: string; manufacturer: string | null } | null;
};

type Shipment = {
  id: string;
  tracking: string | null;
  carrier: string | null;
  quantity: number;
  receivedQuantity: number;
  receivedAt: Date | null;
  createdAt: Date;
  notes: string | null;
  lines: ShipmentLine[];
};

type User = { id: string; profile: { firstName: string; lastName: string } | null };

type PO = {
  id: string;
  poNumber: string | null;
  revision: number;
  sentAt: Date | null;
  vendor: { id: string; name: string } | null;
  status: string;
  notes: string | null;
  createdAt: Date;
  project: { id: string; name: string; customer: { name: string } } | null;
  lines: POLine[];
  shipments: Shipment[];
  quote: { id: string } | null;
  shipToAddress: string | null;
  billToAddress: string | null;
  shippingMethod: string | null;
  paymentTerms: string | null;
  creditLimit: number | null;
  buyerId: string | null;
  buyer: { id: string; profile: { firstName: string; lastName: string } | null } | null;
};

const STATUS_OPTIONS = ["DRAFT", "SENT", "PARTIALLY_RECEIVED", "RECEIVED", "CANCELLED"] as const;
const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  PARTIALLY_RECEIVED: "Partially Received",
  RECEIVED: "Received",
  CANCELLED: "Cancelled",
};
const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  SENT: "bg-blue-100 text-blue-700",
  PARTIALLY_RECEIVED: "bg-amber-100 text-amber-700",
  RECEIVED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-600",
};

export default function POEditor({ po, projectId, users }: { po: PO; projectId: string; users: User[] }) {
  const router = useRouter();
  const [status, setStatus] = useState(po.status);
  const [lines, setLines] = useState<POLine[]>(po.lines);
  const [shipments, setShipments] = useState<Shipment[]>(po.shipments);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Shipment form
  const [showShipmentForm, setShowShipmentForm] = useState(false);
  const [tracking, setTracking] = useState("");
  const [carrier, setCarrier] = useState("");
  const [shipmentLineIds, setShipmentLineIds] = useState<Set<string>>(new Set());
  const [addingShipment, setAddingShipment] = useState(false);

  // Inline line editing
  const [editingLineId, setEditingLineId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState("");
  const [editCost, setEditCost] = useState("");

  // Resend state
  const [resending, setResending] = useState(false);
  const [revision, setRevision] = useState(po.revision);

  // PO info state
  const [editingInfo, setEditingInfo] = useState(false);
  const [savingInfo, setSavingInfo] = useState(false);
  const [infoForm, setInfoForm] = useState({
    shipToAddress: po.shipToAddress ?? "",
    billToAddress: po.billToAddress ?? "",
    shippingMethod: po.shippingMethod ?? "",
    paymentTerms: po.paymentTerms ?? "",
    creditLimit: po.creditLimit != null ? String(po.creditLimit) : "",
    buyerId: po.buyerId ?? "",
  });

  async function handleSaveInfo() {
    setSavingInfo(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/purchase-orders/${po.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shipToAddress: infoForm.shipToAddress || null,
          billToAddress: infoForm.billToAddress || null,
          shippingMethod: infoForm.shippingMethod || null,
          paymentTerms: infoForm.paymentTerms || null,
          creditLimit: infoForm.creditLimit ? parseFloat(infoForm.creditLimit) : null,
          buyerId: infoForm.buyerId || null,
        }),
      });
      if (!res.ok) throw new Error();
      setEditingInfo(false);
      showToast("success", "PO details saved");
    } catch {
      showToast("error", "Failed to save PO details");
    } finally {
      setSavingInfo(false);
    }
  }

  function buyerLabel(id: string | null) {
    if (!id) return "—";
    const u = users.find((u) => u.id === id);
    if (!u?.profile) return "—";
    return `${u.profile.firstName} ${u.profile.lastName}`;
  }

  // Add line state
  const [showAddLine, setShowAddLine] = useState(false);
  const [itemQuery, setItemQuery] = useState("");
  const [itemResults, setItemResults] = useState<{ id: string; itemNumber: string; manufacturer: string | null; description: string | null }[]>([]);
  const [selectedItem, setSelectedItem] = useState<{ id: string; itemNumber: string; manufacturer: string | null; description: string | null } | null>(null);
  const [addQty, setAddQty] = useState("1");
  const [addCost, setAddCost] = useState("");
  const [addingLine, setAddingLine] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  async function handleMarkReceived(shipmentId: string) {
    const shipment = shipments.find((s) => s.id === shipmentId);
    if (!shipment) return;
    try {
      const res = await fetch(
        `/api/projects/${projectId}/purchase-orders/${po.id}/shipments/${shipmentId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ receivedAt: new Date().toISOString() }),
        },
      );
      if (!res.ok) throw new Error();

      setShipments((prev) =>
        prev.map((s) => (s.id === shipmentId ? { ...s, receivedAt: new Date() } : s)),
      );

      const updatedLineIds = new Set(
        shipment.lines.map((sl) => sl.poLineId).filter(Boolean),
      );
      if (updatedLineIds.size > 0) {
        setLines((prev) =>
          prev.map((l) => {
            if (!updatedLineIds.has(l.id)) return l;
            const shipLine = shipment.lines.find((sl) => sl.poLineId === l.id);
            const newQty = Math.min(l.quantity, l.receivedQuantity + (shipLine?.quantity ?? 0));
            fetch(`/api/projects/${projectId}/purchase-orders/${po.id}/lines/${l.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ receivedQuantity: newQty }),
            });
            return { ...l, receivedQuantity: newQty };
          }),
        );
      }

      showToast("success", "Shipment marked as received");
      router.refresh();
    } catch {
      showToast("error", "Failed to update shipment");
    }
  }

  async function handleStatusChange(newStatus: string) {
    setStatus(newStatus);
    try {
      await fetch(`/api/projects/${projectId}/purchase-orders/${po.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      router.refresh();
    } catch {
      showToast("error", "Failed to update status");
    }
  }

  async function handleReceivedQtyChange(lineId: string, qty: number) {
    setLines((prev) =>
      prev.map((l) => (l.id === lineId ? { ...l, receivedQuantity: qty } : l)),
    );
    try {
      await fetch(`/api/projects/${projectId}/purchase-orders/${po.id}/lines/${lineId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receivedQuantity: qty }),
      });
    } catch {
      showToast("error", "Failed to update received qty");
    }
  }

  function startEditLine(line: POLine) {
    setEditingLineId(line.id);
    setEditQty(String(line.quantity));
    setEditCost(String(line.cost));
  }

  async function handleSaveLineEdit(lineId: string) {
    const qty = parseInt(editQty);
    const cost = parseFloat(editCost);
    if (isNaN(qty) || isNaN(cost)) return;

    setLines((prev) =>
      prev.map((l) => (l.id === lineId ? { ...l, quantity: qty, cost, costOverridden: true } : l)),
    );
    setEditingLineId(null);

    try {
      await fetch(`/api/projects/${projectId}/purchase-orders/${po.id}/lines/${lineId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: qty, cost }),
      });
    } catch {
      showToast("error", "Failed to update line");
    }
  }

  async function handleResend() {
    if (!confirm(`Resend this PO as revision ${revision + 1}? This will increment the revision number.`)) return;
    setResending(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/purchase-orders/${po.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resend: true }),
      });
      if (!res.ok) throw new Error();
      setRevision((r) => r + 1);
      setStatus("SENT");
      showToast("success", `PO resent as revision ${revision + 1}`);
      router.refresh();
    } catch {
      showToast("error", "Failed to resend PO");
    } finally {
      setResending(false);
    }
  }

  async function handleAddShipment() {
    if (!tracking.trim()) { showToast("error", "Tracking number required"); return; }
    if (shipmentLineIds.size === 0) { showToast("error", "Select at least one line"); return; }
    setAddingShipment(true);
    try {
      const selectedLines = lines.filter((l) => shipmentLineIds.has(l.id));
      const totalQty = selectedLines.reduce((s, l) => s + l.quantity, 0);
      const res = await fetch(
        `/api/projects/${projectId}/purchase-orders/${po.id}/shipments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tracking: tracking.trim(),
            carrier: carrier.trim() || null,
            quantity: totalQty,
            lineIds: [...shipmentLineIds],
          }),
        },
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      setShipments((prev) => [data.shipment, ...prev]);
      setTracking("");
      setCarrier("");
      setShipmentLineIds(new Set());
      setShowShipmentForm(false);
      showToast("success", "Shipment added");
      router.refresh();
    } catch {
      showToast("error", "Failed to add shipment");
    } finally {
      setAddingShipment(false);
    }
  }

  async function handleDeleteLine(lineId: string) {
    setLines((prev) => prev.filter((l) => l.id !== lineId));
    try {
      await fetch(`/api/projects/${projectId}/purchase-orders/${po.id}/lines/${lineId}`, {
        method: "DELETE",
      });
    } catch {
      showToast("error", "Failed to remove line");
    }
  }

  function handleItemSearch(q: string) {
    setItemQuery(q);
    setSelectedItem(null);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!q.trim()) { setItemResults([]); return; }
    searchTimeout.current = setTimeout(async () => {
      const res = await fetch(`/api/items?q=${encodeURIComponent(q)}&limit=10`);
      const data = await res.json();
      setItemResults(data);
    }, 250);
  }

  async function handleAddLine() {
    if (!selectedItem) { showToast("error", "Select an item"); return; }
    const qty = parseInt(addQty);
    const cost = parseFloat(addCost);
    if (!qty || isNaN(cost)) { showToast("error", "Valid quantity and cost required"); return; }
    setAddingLine(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/purchase-orders/${po.id}/lines`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: selectedItem.id, quantity: qty, cost }),
      });
      if (!res.ok) throw new Error();
      const line = await res.json();
      setLines((prev) => [...prev, line]);
      setShowAddLine(false);
      setItemQuery("");
      setItemResults([]);
      setSelectedItem(null);
      setAddQty("1");
      setAddCost("");
    } catch {
      showToast("error", "Failed to add line");
    } finally {
      setAddingLine(false);
    }
  }

  const totalCost = lines.reduce((s, l) => s + l.cost * l.quantity, 0);
  const totalLines = lines.reduce((s, l) => s + l.quantity, 0);
  const totalReceived = lines.reduce((s, l) => s + l.receivedQuantity, 0);
  const canEdit = status === "DRAFT";

  return (
    <div className="bg-[#F7F6F3]">
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium shadow-lg border ${
          toast.type === "success" ? "bg-white border-green-200 text-green-700" : "bg-white border-red-200 text-red-600"
        }`}>
          {toast.type === "success" ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
          {toast.msg}
        </div>
      )}

      <div className="max-w-4xl mx-auto px-6 py-10">
        <button
          onClick={() => router.push(po.project ? `/projects/${projectId}` : `/projects`)}
          className="flex items-center gap-2 text-sm text-[#666] hover:text-[#111] mb-6 transition-colors"
        >
          <ArrowLeft size={15} />
          {po.project?.name ?? "Projects"}
        </button>

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#999] mb-1">
              <span>{po.project?.customer.name ?? "—"}</span>
              <span>·</span>
              <span>{po.project?.name ?? "—"}</span>
              {po.quote && (
                <>
                  <span>·</span>
                  <a href={`/projects/${projectId}/quotes/${po.quote.id}`} className="hover:text-[#111] transition-colors">
                    Quote #{po.quote.id.slice(0, 8).toUpperCase()}
                  </a>
                </>
              )}
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-[#111] tracking-tight">
                {po.poNumber ?? `PO — ${po.vendor?.name ?? "Unknown Vendor"}`}
              </h1>
              {revision > 1 && (
                <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                  Rev {revision}
                </span>
              )}
            </div>
            <p className="text-sm text-[#888] mt-1">
              {po.vendor?.name ?? "—"} · {new Date(po.createdAt).toLocaleDateString()}
              {po.sentAt && ` · Sent ${new Date(po.sentAt).toLocaleDateString()}`}
              {" · "}{totalReceived}/{totalLines} items received
            </p>
            <p className="text-xs text-[#aaa] mt-0.5 font-medium">
              Total cost: ${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div className="flex flex-col items-end gap-3">
            {/* Status buttons */}
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-colors ${
                    status === s ? `${STATUS_COLORS[s]} border-current` : "border-[#E5E3DE] text-[#999] hover:bg-[#F7F6F3]"
                  }`}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>

            {/* Resend button */}
            {(status === "SENT" || status === "DRAFT") && (
              <button
                onClick={handleResend}
                disabled={resending}
                className="flex items-center gap-2 text-xs font-semibold bg-[#111] text-white px-3 py-1.5 rounded-xl hover:bg-[#333] disabled:opacity-40 transition-colors"
              >
                <Send size={12} />
                {resending ? "Sending…" : status === "DRAFT" ? "Send PO" : `Resend (Rev ${revision + 1})`}
              </button>
            )}
          </div>
        </div>

        {/* PO Info Card */}
        <div className="bg-white border border-[#E5E3DE] rounded-2xl overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-[#F0EEE9] flex items-center justify-between">
            <h3 className="font-semibold text-sm text-[#111]">Order Details</h3>
            {!editingInfo ? (
              <button
                onClick={() => setEditingInfo(true)}
                className="flex items-center gap-1.5 text-xs text-[#888] hover:text-[#111] transition-colors"
              >
                <Pencil size={12} /> Edit
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditingInfo(false)}
                  className="text-xs text-[#888] hover:text-[#111] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveInfo}
                  disabled={savingInfo}
                  className="flex items-center gap-1 text-xs font-semibold bg-[#111] text-white px-3 py-1.5 rounded-lg hover:bg-[#333] disabled:opacity-40 transition-colors"
                >
                  {savingInfo ? "Saving…" : "Save"}
                </button>
              </div>
            )}
          </div>

          <div className="px-6 py-5 grid grid-cols-3 gap-x-8 gap-y-4">
            {/* Vendor ID — always read-only */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#999] mb-1">Vendor ID</p>
              <p className="text-sm font-mono text-[#111]">{po.vendor?.id?.slice(0, 8).toUpperCase() ?? "—"}</p>
            </div>

            {editingInfo ? (
              <>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-widest text-[#999] mb-1.5">Buyer</label>
                  <select
                    className="w-full text-sm border border-[#E5E3DE] rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-[#111]"
                    value={infoForm.buyerId}
                    onChange={(e) => setInfoForm((f) => ({ ...f, buyerId: e.target.value }))}
                  >
                    <option value="">— None —</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.profile ? `${u.profile.firstName} ${u.profile.lastName}` : u.id}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-widest text-[#999] mb-1.5">Shipping Method</label>
                  <input
                    className="w-full text-sm border border-[#E5E3DE] rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#111]"
                    value={infoForm.shippingMethod}
                    onChange={(e) => setInfoForm((f) => ({ ...f, shippingMethod: e.target.value }))}
                    placeholder="e.g. UPS Ground"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-widest text-[#999] mb-1.5">Payment Terms</label>
                  <input
                    className="w-full text-sm border border-[#E5E3DE] rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#111]"
                    value={infoForm.paymentTerms}
                    onChange={(e) => setInfoForm((f) => ({ ...f, paymentTerms: e.target.value }))}
                    placeholder="e.g. Net 30"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-widest text-[#999] mb-1.5">Credit Limit</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[#999]">$</span>
                    <input
                      type="number"
                      className="w-full text-sm border border-[#E5E3DE] rounded-lg pl-6 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#111]"
                      value={infoForm.creditLimit}
                      onChange={(e) => setInfoForm((f) => ({ ...f, creditLimit: e.target.value }))}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="col-span-3 grid grid-cols-2 gap-x-8 gap-y-4 mt-1 border-t border-[#F0EEE9] pt-4">
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-widest text-[#999] mb-1.5">Ship-To Address</label>
                    <textarea
                      rows={3}
                      className="w-full text-sm border border-[#E5E3DE] rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-[#111]"
                      value={infoForm.shipToAddress}
                      onChange={(e) => setInfoForm((f) => ({ ...f, shipToAddress: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-widest text-[#999] mb-1.5">Bill-To Address</label>
                    <textarea
                      rows={3}
                      className="w-full text-sm border border-[#E5E3DE] rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-[#111]"
                      value={infoForm.billToAddress}
                      onChange={(e) => setInfoForm((f) => ({ ...f, billToAddress: e.target.value }))}
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[#999] mb-1">Buyer</p>
                  <p className="text-sm text-[#111]">{buyerLabel(infoForm.buyerId || null)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[#999] mb-1">Shipping Method</p>
                  <p className="text-sm text-[#111]">{infoForm.shippingMethod || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[#999] mb-1">Payment Terms</p>
                  <p className="text-sm text-[#111]">{infoForm.paymentTerms || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[#999] mb-1">Credit Limit</p>
                  <p className="text-sm text-[#111]">
                    {infoForm.creditLimit
                      ? `$${parseFloat(infoForm.creditLimit).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                      : "—"}
                  </p>
                </div>
                {(infoForm.shipToAddress || infoForm.billToAddress) && (
                  <div className="col-span-3 grid grid-cols-2 gap-x-8 mt-1 border-t border-[#F0EEE9] pt-4">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#999] mb-1">Ship-To Address</p>
                      <p className="text-sm text-[#111] whitespace-pre-wrap">{infoForm.shipToAddress || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#999] mb-1">Bill-To Address</p>
                      <p className="text-sm text-[#111] whitespace-pre-wrap">{infoForm.billToAddress || "—"}</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Lines */}
          <div className="bg-white border border-[#E5E3DE] rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#F0EEE9] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <h3 className="font-semibold text-sm text-[#111]">Line Items</h3>
                <span className="text-xs text-[#bbb]">{lines.length}</span>
              </div>
              {canEdit && (
                <button
                  onClick={() => setShowAddLine((v) => !v)}
                  className="flex items-center gap-1.5 text-xs font-semibold bg-[#111] text-white px-3 py-1.5 rounded-lg hover:bg-[#333] transition-colors"
                >
                  <Plus size={12} />
                  Add Item
                </button>
              )}
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#F0EEE9] bg-[#FAFAF8]">
                  <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-[#999] px-6 py-3">Item</th>
                  <th className="text-right text-[10px] font-semibold uppercase tracking-widest text-[#999] px-4 py-3 w-28">Ordered</th>
                  <th className="text-right text-[10px] font-semibold uppercase tracking-widest text-[#999] px-4 py-3 w-28">Received</th>
                  <th className="text-right text-[10px] font-semibold uppercase tracking-widest text-[#999] px-6 py-3 w-32">Cost (ea)</th>
                  {canEdit && <th className="w-16" />}
                </tr>
              </thead>
              <tbody>
                {lines.map((line) => {
                  const fullyReceived = line.receivedQuantity >= line.quantity;
                  const isEditing = editingLineId === line.id;
                  return (
                    <tr key={line.id} className="border-b border-[#F7F6F3] last:border-0">
                      <td className="px-6 py-3">
                        {line.item ? (
                          <>
                            <p className="text-sm font-medium text-[#111]">
                              {line.item.manufacturer && (
                                <span className="text-[#999] mr-1">{line.item.manufacturer}</span>
                              )}
                              {line.item.itemNumber}
                            </p>
                            {line.item.description && (
                              <p className="text-xs text-[#999] mt-0.5">{line.item.description}</p>
                            )}
                          </>
                        ) : (
                          <p className="text-sm text-[#666]">—</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isEditing ? (
                          <input
                            type="number"
                            min={1}
                            value={editQty}
                            onChange={(e) => setEditQty(e.target.value)}
                            className="w-16 text-right text-xs border border-[#E5E3DE] rounded-lg px-2 py-1 focus:outline-none focus:border-[#111]"
                          />
                        ) : (
                          <span className="text-sm text-[#666]">{line.quantity}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {fullyReceived && <CheckCircle2 size={13} className="text-green-500" />}
                          <input
                            type="number"
                            min={0}
                            max={line.quantity}
                            value={line.receivedQuantity}
                            onChange={(e) =>
                              handleReceivedQtyChange(line.id, Math.min(line.quantity, parseInt(e.target.value) || 0))
                            }
                            className="w-16 text-right text-xs border border-[#E5E3DE] rounded-lg px-2 py-1 focus:outline-none focus:border-[#111]"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-3 text-right">
                        {isEditing ? (
                          <div className="relative inline-flex">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-[#999]">$</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={editCost}
                              onChange={(e) => setEditCost(e.target.value)}
                              className="w-24 text-right text-xs border border-[#E5E3DE] rounded-lg pl-5 pr-2 py-1 focus:outline-none focus:border-[#111]"
                            />
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            {line.costOverridden && (
                              <span title="Cost manually overridden" className="text-[9px] font-semibold text-amber-600 bg-amber-50 px-1 py-0.5 rounded">
                                OVR
                              </span>
                            )}
                            <span className="text-sm text-[#666]">
                              ${line.cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        )}
                      </td>
                      {canEdit && (
                        <td className="px-2 py-3">
                          {isEditing ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleSaveLineEdit(line.id)}
                                className="p-1 rounded hover:bg-green-50 text-green-600"
                              >
                                <CheckCircle2 size={13} />
                              </button>
                              <button
                                onClick={() => setEditingLineId(null)}
                                className="p-1 rounded hover:bg-[#F0EEE9] text-[#999]"
                              >
                                <AlertCircle size={13} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-0.5">
                              <button
                                onClick={() => startEditLine(line)}
                                className="p-1 rounded hover:bg-[#F0EEE9] text-[#bbb] hover:text-[#666]"
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                onClick={() => handleDeleteLine(line.id)}
                                className="p-1 rounded hover:bg-red-50 text-[#bbb] hover:text-red-500"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Add line form */}
            {showAddLine && (
              <div className="px-6 py-5 border-t border-[#F0EEE9] bg-[#FAFAF8] space-y-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#888]">Add Item</p>

                {/* Item search */}
                <div className="relative">
                  <div className="flex items-center gap-2 border border-[#E5E3DE] rounded-xl px-3 py-2 bg-white focus-within:border-[#111]">
                    <Search size={13} className="text-[#bbb] flex-shrink-0" />
                    <input
                      type="text"
                      placeholder="Search by item number or description…"
                      value={selectedItem ? `${selectedItem.itemNumber}${selectedItem.manufacturer ? ` · ${selectedItem.manufacturer}` : ""}` : itemQuery}
                      onChange={(e) => handleItemSearch(e.target.value)}
                      onFocus={() => { if (selectedItem) { setSelectedItem(null); setItemQuery(""); setItemResults([]); } }}
                      className="flex-1 text-sm bg-transparent focus:outline-none"
                    />
                  </div>
                  {itemResults.length > 0 && !selectedItem && (
                    <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-[#E5E3DE] rounded-xl shadow-lg z-10 overflow-hidden max-h-52 overflow-y-auto">
                      {itemResults.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            setSelectedItem(item);
                            setItemResults([]);
                          }}
                          className="w-full flex items-start gap-3 px-4 py-2.5 hover:bg-[#F7F6F3] text-left"
                        >
                          <div>
                            <p className="text-sm font-medium text-[#111]">{item.itemNumber}</p>
                            {(item.manufacturer || item.description) && (
                              <p className="text-xs text-[#999] mt-0.5 truncate">
                                {[item.manufacturer, item.description].filter(Boolean).join(" · ")}
                              </p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Qty + cost */}
                <div className="flex items-center gap-3">
                  <div>
                    <label className="text-xs text-[#999] block mb-1">Qty</label>
                    <input
                      type="number"
                      min={1}
                      value={addQty}
                      onChange={(e) => setAddQty(e.target.value)}
                      className="w-20 text-sm border border-[#E5E3DE] rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#111]"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#999] block mb-1">Cost each</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[#999]">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={addCost}
                        onChange={(e) => setAddCost(e.target.value)}
                        placeholder="0.00"
                        className="w-28 text-sm border border-[#E5E3DE] rounded-lg pl-6 pr-2 py-1.5 focus:outline-none focus:border-[#111]"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleAddLine}
                    disabled={addingLine || !selectedItem}
                    className="flex items-center gap-2 bg-[#111] text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-[#333] disabled:opacity-40 transition-colors"
                  >
                    <Plus size={13} />
                    {addingLine ? "Adding…" : "Add to PO"}
                  </button>
                  <button
                    onClick={() => { setShowAddLine(false); setItemQuery(""); setItemResults([]); setSelectedItem(null); setAddQty("1"); setAddCost(""); }}
                    className="text-sm text-[#999] hover:text-[#111] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Shipments */}
          <div className="bg-white border border-[#E5E3DE] rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#F0EEE9] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Truck size={15} className="text-[#999]" />
                <h3 className="font-semibold text-sm text-[#111]">Shipments</h3>
                <span className="text-xs text-[#bbb]">{shipments.length}</span>
              </div>
              <button
                onClick={() => setShowShipmentForm(true)}
                className="flex items-center gap-1.5 text-xs font-semibold bg-[#111] text-white px-3 py-1.5 rounded-lg hover:bg-[#333] transition-colors"
              >
                <Plus size={12} />
                Add Shipment
              </button>
            </div>

            {showShipmentForm && (
              <div className="px-6 py-5 border-b border-[#F0EEE9] bg-[#FAFAF8] space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-[#888] uppercase tracking-widest block mb-1.5">Tracking #</label>
                    <input
                      type="text"
                      value={tracking}
                      onChange={(e) => setTracking(e.target.value)}
                      placeholder="1Z999AA10123456784"
                      className="w-full text-sm border border-[#E5E3DE] rounded-xl px-3 py-2 focus:outline-none focus:border-[#111]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#888] uppercase tracking-widest block mb-1.5">Carrier</label>
                    <input
                      type="text"
                      value={carrier}
                      onChange={(e) => setCarrier(e.target.value)}
                      placeholder="UPS, FedEx, USPS…"
                      className="w-full text-sm border border-[#E5E3DE] rounded-xl px-3 py-2 focus:outline-none focus:border-[#111]"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#888] uppercase tracking-widest block mb-2">
                    Items in this shipment
                  </label>
                  <div className="space-y-1">
                    {lines.map((line) => (
                      <button
                        key={line.id}
                        onClick={() =>
                          setShipmentLineIds((prev) => {
                            const next = new Set(prev);
                            next.has(line.id) ? next.delete(line.id) : next.add(line.id);
                            return next;
                          })
                        }
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white transition-colors text-left"
                      >
                        <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-colors ${
                          shipmentLineIds.has(line.id) ? "bg-[#111] border-[#111]" : "border-[#D0CEC8] bg-white"
                        }`}>
                          {shipmentLineIds.has(line.id) && (
                            <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                              <polyline points="1,3.5 3.5,6 8,1" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>
                        <span className="text-sm text-[#111]">{line.item?.itemNumber ?? "—"}</span>
                        <span className="text-xs text-[#999]">qty {line.quantity}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleAddShipment}
                    disabled={addingShipment}
                    className="flex items-center gap-2 bg-[#111] text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-[#333] disabled:opacity-40 transition-colors"
                  >
                    <Truck size={13} />
                    {addingShipment ? "Adding…" : "Add Shipment"}
                  </button>
                  <button
                    onClick={() => { setShowShipmentForm(false); setTracking(""); setCarrier(""); setShipmentLineIds(new Set()); }}
                    className="text-sm text-[#999] hover:text-[#111] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {shipments.length === 0 && !showShipmentForm ? (
              <div className="px-6 py-10 text-center">
                <p className="text-sm text-[#bbb]">No shipments yet — add tracking info above</p>
              </div>
            ) : (
              <div className="divide-y divide-[#F0EEE9]">
                {shipments.map((s) => (
                  <div key={s.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <p className="text-sm font-mono font-semibold text-[#111]">{s.tracking}</p>
                        {s.carrier && (
                          <span className="text-xs text-[#999] bg-[#F0EEE9] px-2 py-0.5 rounded-md">{s.carrier}</span>
                        )}
                        <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                          s.receivedAt ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                        }`}>
                          {s.receivedAt ? (
                            <><CheckCircle2 size={10} /> Received {new Date(s.receivedAt).toLocaleDateString()}</>
                          ) : (
                            <><Clock size={10} /> In Transit</>
                          )}
                        </span>
                      </div>
                      {!s.receivedAt && (
                        <button
                          onClick={() => handleMarkReceived(s.id)}
                          className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-[#E5E3DE] hover:bg-green-50 hover:border-green-200 hover:text-green-700 transition-colors"
                        >
                          Mark Received
                        </button>
                      )}
                    </div>

                    {s.lines.length > 0 && (
                      <div className="mt-3 space-y-1.5 pl-1">
                        {s.lines.map((sl) => {
                          const poLine = lines.find((l) => l.id === sl.poLineId);
                          const fullyReceived = poLine
                            ? poLine.receivedQuantity >= poLine.quantity
                            : false;
                          return (
                            <div key={sl.id} className="flex items-center gap-2.5">
                              {fullyReceived ? (
                                <CheckCircle2 size={12} className="text-green-500 flex-shrink-0" />
                              ) : (
                                <div className="w-3 h-3 rounded-full border border-[#D0CEC8] flex-shrink-0" />
                              )}
                              <span className="text-xs font-mono text-[#444]">
                                {sl.item?.itemNumber ?? "—"}
                              </span>
                              {sl.item?.manufacturer && (
                                <span className="text-xs text-[#999]">{sl.item.manufacturer}</span>
                              )}
                              <span className="text-xs text-[#bbb]">×{sl.quantity}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
