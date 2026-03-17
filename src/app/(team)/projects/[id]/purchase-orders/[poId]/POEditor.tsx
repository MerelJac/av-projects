"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Truck,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
} from "lucide-react";
import notFound from "@/app/not-found";

type POLine = {
  id: string;
  itemId: string | null;
  quantity: number;
  receivedQuantity: number;
  cost: number;
  item: {
    id: string;
    itemNumber: string;
    manufacturer: string | null;
    description: string | null;
  } | null;
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
};

type PO = {
  id: string;
  vendor: string;
  status: string;
  notes: string | null;
  createdAt: Date;
  project: { id: string; name: string; customer: { name: string } } | null;
  lines: POLine[];
  shipments: Shipment[];
  quote: { id: string } | null;
};

const STATUS_OPTIONS = [
  "DRAFT",
  "SENT",
  "PARTIALLY_RECEIVED",
  "RECEIVED",
] as const;
const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  PARTIALLY_RECEIVED: "Partially Received",
  RECEIVED: "Received",
};
const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  SENT: "bg-blue-100 text-blue-700",
  PARTIALLY_RECEIVED: "bg-amber-100 text-amber-700",
  RECEIVED: "bg-green-100 text-green-700",
};

export default function POEditor({
  po,
  projectId,
}: {
  po: PO;
  projectId: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(po.status);
  const [lines, setLines] = useState<POLine[]>(po.lines);
  const [shipments, setShipments] = useState<Shipment[]>(po.shipments);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  // Add shipment form state
  const [showShipmentForm, setShowShipmentForm] = useState(false);
  const [tracking, setTracking] = useState("");
  const [carrier, setCarrier] = useState("");
  const [shipmentLineIds, setShipmentLineIds] = useState<Set<string>>(
    new Set(),
  );
  const [addingShipment, setAddingShipment] = useState(false);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  async function handleMarkReceived(shipmentId: string) {
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
      prev.map((s) =>
        s.id === shipmentId ? { ...s, receivedAt: new Date() } : s,
      ),
    );
    showToast("success", "Shipment marked as received");
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
      await fetch(
        `/api/projects/${projectId}/purchase-orders/${po.id}/lines/${lineId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ receivedQuantity: qty }),
        },
      );
    } catch {
      showToast("error", "Failed to update received qty");
    }
  }

  async function handleAddShipment() {
    if (!tracking.trim()) {
      showToast("error", "Tracking number required");
      return;
    }
    if (shipmentLineIds.size === 0) {
      showToast("error", "Select at least one line");
      return;
    }
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

  const totalLines = lines.reduce((s, l) => s + l.quantity, 0);
  const totalReceived = lines.reduce((s, l) => s + l.receivedQuantity, 0);
  if (!po) return notFound();
  return (
    <div className="min-h-screen bg-[#F7F6F3]">
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

      <div className="max-w-4xl mx-auto px-6 py-10">
        <button
          onClick={() =>
            router.push(po.project ? `/projects/${projectId}` : `/projects`)
          }
          className="flex items-center gap-2 text-sm text-[#666] hover:text-[#111] mb-6 transition-colors"
        >
          <ArrowLeft size={15} />
          <span>{po.project?.customer.name ?? "—"}</span>
          <span>·</span>
          <span>{po.project?.name ?? "—"}</span>
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
                  <a
                    href={`/projects/${projectId}/quotes/${po.quote.id}`}
                    className="hover:text-[#111] transition-colors"
                  >
                    Quote #{po.quote.id.slice(0, 8).toUpperCase()}
                  </a>
                </>
              )}
            </div>
            <h1 className="text-2xl font-bold text-[#111] tracking-tight">
              PO — {po.vendor}
            </h1>
            <p className="text-sm text-[#888] mt-1">
              {new Date(po.createdAt).toLocaleDateString()} · {totalReceived}/
              {totalLines} items received
            </p>
          </div>
          {/* Status selector */}
          <div className="flex items-center gap-2">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-colors ${
                  status === s
                    ? `${STATUS_COLORS[s]} border-current`
                    : "border-[#E5E3DE] text-[#999] hover:bg-[#F7F6F3]"
                }`}
              >
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {/* Lines */}
          <div className="bg-white border border-[#E5E3DE] rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#F0EEE9] flex items-center gap-2.5">
              <h3 className="font-semibold text-sm text-[#111]">Line Items</h3>
              <span className="text-xs text-[#bbb]">{lines.length}</span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#F0EEE9] bg-[#FAFAF8]">
                  <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-[#999] px-6 py-3">
                    Item
                  </th>
                  <th className="text-right text-[10px] font-semibold uppercase tracking-widest text-[#999] px-4 py-3 w-24">
                    Ordered
                  </th>
                  <th className="text-right text-[10px] font-semibold uppercase tracking-widest text-[#999] px-4 py-3 w-28">
                    Received
                  </th>
                  <th className="text-right text-[10px] font-semibold uppercase tracking-widest text-[#999] px-6 py-3 w-24">
                    Cost
                  </th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line) => {
                  const fullyReceived = line.receivedQuantity >= line.quantity;
                  return (
                    <tr
                      key={line.id}
                      className="border-b border-[#F7F6F3] last:border-0"
                    >
                      <td className="px-6 py-3">
                        {line.item ? (
                          <>
                            <p className="text-sm font-medium text-[#111]">
                              {line.item.manufacturer && (
                                <span className="text-[#999] mr-1">
                                  {line.item.manufacturer}
                                </span>
                              )}
                              {line.item.itemNumber}
                            </p>
                            {line.item.description && (
                              <p className="text-xs text-[#999] mt-0.5">
                                {line.item.description}
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="text-sm text-[#666]">—</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-[#666]">
                        {line.quantity}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {fullyReceived && (
                            <CheckCircle2
                              size={13}
                              className="text-green-500"
                            />
                          )}
                          <input
                            type="number"
                            min={0}
                            max={line.quantity}
                            value={line.receivedQuantity}
                            onChange={(e) =>
                              handleReceivedQtyChange(
                                line.id,
                                Math.min(
                                  line.quantity,
                                  parseInt(e.target.value) || 0,
                                ),
                              )
                            }
                            className="w-16 text-right text-xs border border-[#E5E3DE] rounded-lg px-2 py-1 focus:outline-none focus:border-[#111]"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-3 text-right text-sm text-[#666]">
                        $
                        {(line.cost * line.quantity).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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

            {/* Add shipment form */}
            {showShipmentForm && (
              <div className="px-6 py-5 border-b border-[#F0EEE9] bg-[#FAFAF8] space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-[#888] uppercase tracking-widest block mb-1.5">
                      Tracking #
                    </label>
                    <input
                      type="text"
                      value={tracking}
                      onChange={(e) => setTracking(e.target.value)}
                      placeholder="1Z999AA10123456784"
                      className="w-full text-sm border border-[#E5E3DE] rounded-xl px-3 py-2 focus:outline-none focus:border-[#111]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#888] uppercase tracking-widest block mb-1.5">
                      Carrier
                    </label>
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
                            next.has(line.id)
                              ? next.delete(line.id)
                              : next.add(line.id);
                            return next;
                          })
                        }
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white transition-colors text-left"
                      >
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-colors ${
                            shipmentLineIds.has(line.id)
                              ? "bg-[#111] border-[#111]"
                              : "border-[#D0CEC8] bg-white"
                          }`}
                        >
                          {shipmentLineIds.has(line.id) && (
                            <svg
                              width="9"
                              height="7"
                              viewBox="0 0 9 7"
                              fill="none"
                            >
                              <polyline
                                points="1,3.5 3.5,6 8,1"
                                stroke="white"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </div>
                        <span className="text-sm text-[#111]">
                          {line.item?.itemNumber ?? "—"}
                        </span>
                        <span className="text-xs text-[#999]">
                          qty {line.quantity}
                        </span>
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
                    onClick={() => {
                      setShowShipmentForm(false);
                      setTracking("");
                      setCarrier("");
                      setShipmentLineIds(new Set());
                    }}
                    className="text-sm text-[#999] hover:text-[#111] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {shipments.length === 0 && !showShipmentForm ? (
              <div className="px-6 py-10 text-center">
                <p className="text-sm text-[#bbb]">
                  No shipments yet — add tracking info above
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#F7F6F3]">
                {shipments.map((s) => (
                  <div
                    key={s.id}
                    className="px-6 py-4 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2.5">
                        <p className="text-sm font-mono font-semibold text-[#111]">
                          {s.tracking}
                        </p>
                        {s.carrier && (
                          <span className="text-xs text-[#999] bg-[#F0EEE9] px-2 py-0.5 rounded-md">
                            {s.carrier}
                          </span>
                        )}
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            s.receivedAt
                              ? "bg-green-100 text-green-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {s.receivedAt
                            ? `Received ${new Date(s.receivedAt).toLocaleDateString()}`
                            : "In Transit"}
                        </span>
                      </div>
                      <p className="text-xs text-[#999] mt-1">
                        {s.quantity} item{s.quantity !== 1 ? "s" : ""} · added{" "}
                        {new Date(s.createdAt).toLocaleDateString()}
                      </p>
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
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
