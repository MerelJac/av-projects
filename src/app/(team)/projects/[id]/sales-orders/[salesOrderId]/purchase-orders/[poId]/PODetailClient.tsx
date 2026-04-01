"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Truck,
  Package,
  CheckCircle2,
  Clock,
  AlertCircle,
  Send,
  Plus,
  X,
  Check,
  RotateCcw,
} from "lucide-react";
import { POWithDetails } from "@/types/purchaseOrder";
import ReturnItemsModal from "@/app/components/team/purchase-orders/ReturnItemsModal";

type SerializedPOLine = Omit<
  POWithDetails["lines"][number],
  "salesOrderLine"
> & {
  salesOrderLine:
    | (Omit<
        NonNullable<POWithDetails["lines"][number]["salesOrderLine"]>,
        "price" | "cost"
      > & { price: number; cost: number | null })
    | null;
};

type POReturnLine = {
  id: string;
  poLineId: string;
  quantity: number;
  creditPerUnit: number | null;
  poLine: { item: { itemNumber: string; manufacturer: string | null } | null };
};

type POReturn = {
  id: string;
  returnNumber: string | null;
  status: string;
  reason: string | null;
  rmaNumber: string | null;
  notes: string | null;
  createdAt: Date | string;
  lines: POReturnLine[];
};

type SerializedPO = Omit<POWithDetails, "lines"> & {
  lines: SerializedPOLine[];
  salesOrder: { customer: { name: string }; project: { name: string } } | null;
  returns: POReturn[];
};

const RETURN_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  SENT: "Sent to Vendor",
  CREDITED: "Credited",
  CANCELLED: "Cancelled",
};
const RETURN_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  SENT: "bg-blue-50 text-blue-700 border-blue-200",
  CREDITED: "bg-green-50 text-green-700 border-green-200",
  CANCELLED: "bg-gray-100 text-gray-500 border-gray-200",
};

const PO_STATUS: Record<
  POWithDetails["status"],
  { label: string; color: string; icon: React.ReactNode }
> = {
  DRAFT: {
    label: "Draft",
    color: "bg-gray-100 text-gray-600",
    icon: <Clock size={13} />,
  },
  SENT: {
    label: "Sent to Vendor",
    color: "bg-blue-100 text-blue-700",
    icon: <Send size={13} />,
  },
  PARTIALLY_RECEIVED: {
    label: "Partially Received",
    color: "bg-amber-100 text-amber-700",
    icon: <AlertCircle size={13} />,
  },
  RECEIVED: {
    label: "Fully Received",
    color: "bg-green-100 text-green-700",
    icon: <CheckCircle2 size={13} />,
  },
    CANCELLED: {
    label: "Cancelled",
    color: "bg-red-100 text-red-700",
    icon: <X size={13} />,
  },
};

export default function PODetailClient({
  po: initialPO,
  projectId,
  salesOrderId,
  currentUserId,
}: {
  po: SerializedPO;
  projectId: string;
  salesOrderId: string;
  currentUserId?: string;
}) {
  const router = useRouter();
  const [po, setPO] = useState(initialPO);
  const [returns, setReturns] = useState<POReturn[]>(initialPO.returns);
  const [showLogShipment, setShowLogShipment] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [updatingReturnId, setUpdatingReturnId] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  function showToastMsg(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  }

  async function refresh() {
    const res = await fetch(
      `/api/projects/${projectId}/sales-orders/${salesOrderId}/purchase-orders/${po.id}`,
    );
    if (res.ok) setPO(await res.json());
  }

  async function handleReturnSaved() {
    setShowReturnModal(false);
    const res = await fetch(
      `/api/projects/${projectId}/purchase-orders/${po.id}/returns`
    );
    if (res.ok) setReturns(await res.json());
    showToastMsg("success", "Return created");
  }

  async function handleUpdateReturnStatus(returnId: string, newStatus: string) {
    setUpdatingReturnId(returnId);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/purchase-orders/${po.id}/returns/${returnId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        }
      );
      if (!res.ok) throw new Error();
      setReturns((prev) =>
        prev.map((r) => (r.id === returnId ? { ...r, status: newStatus } : r))
      );
      if (newStatus === "CREDITED") showToastMsg("success", "Return credited — costs updated");
    } catch {
      showToastMsg("error", "Failed to update return status");
    } finally {
      setUpdatingReturnId(null);
    }
  }

  async function handleDeleteReturn(returnId: string) {
    try {
      await fetch(
        `/api/projects/${projectId}/purchase-orders/${po.id}/returns/${returnId}`,
        { method: "DELETE" }
      );
      setReturns((prev) => prev.filter((r) => r.id !== returnId));
    } catch {
      showToastMsg("error", "Failed to delete return");
    }
  }

  async function markSent() {
    const res = await fetch(
      `/api/projects/${projectId}/sales-orders/${salesOrderId}/purchase-orders/${po.id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "SENT" }),
      },
    );
    if (res.ok) {
      await refresh();
      showToastMsg("success", "Marked as sent");
    }
  }

  const cfg = PO_STATUS[po.status];
  const totalOrdered = po.lines.reduce((s, l) => s + l.quantity, 0);
  const totalReceived = po.lines.reduce((s, l) => s + l.receivedQuantity, 0);
  const totalCost = po.lines.reduce((s, l) => s + l.cost * l.quantity, 0);

  return (
    <div className="bg-[#F7F6F3]">
      {/* Toast */}
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
        {/* Back */}
        <button
          onClick={() =>
            router.back()}
          className="flex items-center gap-2 text-sm text-[#666] hover:text-[#111] mb-6 transition-colors"
        >
          <ArrowLeft size={15} />
          {po.salesOrder?.project.name ?? "Sales Order"}
        </button>

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-xs text-[#999] mb-1">
              {po.salesOrder?.customer.name} · Purchase Order
            </p>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-[#111] tracking-tight font-mono">
                PO-{po.id.toUpperCase()}
              </h1>
              <span
                className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.color}`}
              >
                {cfg.icon}
                {cfg.label}
              </span>
            </div>
            <p className="text-sm text-[#666] mt-1 font-semibold">
              {po.vendor?.name ?? "—"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {po.status === "DRAFT" && (
              <button
                onClick={markSent}
                className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                <Send size={14} />
                Mark Sent to Vendor
              </button>
            )}
            {(po.status === "SENT" || po.status === "PARTIALLY_RECEIVED") && (
              <button
                onClick={() => setShowLogShipment(true)}
                className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl bg-[#111] text-white hover:bg-[#333] transition-colors"
              >
                <Plus size={14} />
                Log Shipment
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Left: lines + shipments */}
          <div className="col-span-2 space-y-5">
            {/* Line Items */}
            <div className="bg-white border border-[#E5E3DE] rounded-2xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-[#F0EEE9]">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#888]">
                  Items Ordered
                </p>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#F0EEE9]">
                    <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-[#999] px-5 py-3">
                      Item
                    </th>
                    <th className="text-right text-[10px] font-semibold uppercase tracking-widest text-[#999] px-3 py-3 w-24">
                      Ordered
                    </th>
                    <th className="text-right text-[10px] font-semibold uppercase tracking-widest text-[#999] px-3 py-3 w-24">
                      Received
                    </th>
                    <th className="text-right text-[10px] font-semibold uppercase tracking-widest text-[#999] px-5 py-3 w-24">
                      Cost
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {po.lines.map((line) => {
                    const pct =
                      line.quantity > 0
                        ? (line.receivedQuantity / line.quantity) * 100
                        : 0;
                    const done = pct >= 100;
                    return (
                      <tr
                        key={line.id}
                        className="border-b border-[#F7F6F3] last:border-0"
                      >
                        <td className="px-5 py-3">
                          <p className="text-sm font-mono text-[#111]">
                            {line.item.itemNumber}
                          </p>
                          {line.item.manufacturer && (
                            <p className="text-[10px] text-[#999]">
                              {line.item.manufacturer}
                            </p>
                          )}
                          {line.salesOrderLine && (
                            <p className="text-[10px] text-[#bbb] mt-0.5 truncate max-w-[200px]">
                              {line.salesOrderLine.description}
                            </p>
                          )}
                        </td>
                        <td className="px-3 py-3 text-right text-sm text-[#666]">
                          {line.quantity}
                        </td>
                        <td className="px-3 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span
                              className={`text-sm font-semibold ${done ? "text-green-600" : line.receivedQuantity > 0 ? "text-amber-600" : "text-[#999]"}`}
                            >
                              {line.receivedQuantity}
                            </span>
                            {done && (
                              <Check size={13} className="text-green-500" />
                            )}
                          </div>
                          <div className="w-full h-1 bg-[#F0EEE9] rounded-full mt-1 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${done ? "bg-green-500" : "bg-amber-400"}`}
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                        </td>
                        <td className="px-5 py-3 text-right text-sm text-[#666]">
                          $
                          {(line.cost * line.quantity).toLocaleString(
                            undefined,
                            { minimumFractionDigits: 2 },
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Shipments */}
            <div className="bg-white border border-[#E5E3DE] rounded-2xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-[#F0EEE9] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Truck size={14} className="text-[#999]" />
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#888]">
                    Shipments
                  </p>
                  {po.shipments.length > 0 && (
                    <span className="text-xs text-[#bbb]">
                      {po.shipments.length}
                    </span>
                  )}
                </div>
                {(po.status === "SENT" ||
                  po.status === "PARTIALLY_RECEIVED") && (
                  <button
                    onClick={() => setShowLogShipment(true)}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#111] text-white hover:bg-[#333] transition-colors"
                  >
                    <Plus size={11} />
                    Log Shipment
                  </button>
                )}
              </div>

              {po.shipments.length === 0 ? (
                <p className="px-5 py-8 text-sm text-[#bbb] text-center">
                  No shipments logged yet
                </p>
              ) : (
                <div className="divide-y divide-[#F7F6F3]">
                  {po.shipments.map((s) => (
                    <div key={s.id} className="px-5 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <Truck
                            size={14}
                            className="text-[#999] mt-0.5 flex-shrink-0"
                          />
                          <div>
                            <p className="text-sm font-semibold text-[#111]">
                              {s.item?.itemNumber ?? "General shipment"} ×{" "}
                              {s.quantity}
                            </p>
                            <div className="flex items-center gap-3 mt-1 flex-wrap">
                              {s.carrier && (
                                <span className="text-xs text-[#666]">
                                  {s.carrier}
                                </span>
                              )}
                              {s.tracking && (
                                <span className="text-xs font-mono text-[#444] bg-[#F7F6F3] px-2 py-0.5 rounded">
                                  {s.tracking}
                                </span>
                              )}
                              {s.shippedBy && (
                                <span className="text-xs text-[#999]">
                                  from {s.shippedBy}
                                </span>
                              )}
                            </div>
                            {s.notes && (
                              <p className="text-xs text-[#999] mt-1">
                                {s.notes}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          {s.receivedAt ? (
                            <span className="text-xs font-semibold text-green-600 flex items-center gap-1">
                              <CheckCircle2 size={11} />
                              Received{" "}
                              {new Date(s.receivedAt).toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="text-xs text-[#999]">
                              In transit
                            </span>
                          )}
                          <p className="text-[10px] text-[#bbb] mt-0.5">
                              {new Date(s.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Returns */}
            <div className="bg-white border border-[#E5E3DE] rounded-2xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-[#F0EEE9] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RotateCcw size={14} className="text-[#999]" />
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#888]">
                    Returns
                  </p>
                  {returns.length > 0 && (
                    <span className="text-xs text-[#bbb]">{returns.length}</span>
                  )}
                </div>
                {po.lines.some((l) => l.receivedQuantity > 0) && po.status !== "CANCELLED" && (
                  <button
                    onClick={() => setShowReturnModal(true)}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#E5E3DE] hover:bg-[#F0EEE9] transition-colors"
                  >
                    <RotateCcw size={11} />
                    Return Items
                  </button>
                )}
              </div>

              {returns.length === 0 ? (
                <p className="px-5 py-8 text-sm text-[#bbb] text-center">No returns on this PO</p>
              ) : (
                <div className="divide-y divide-[#F7F6F3]">
                  {returns.map((ret) => {
                    const totalCredit = ret.lines.reduce(
                      (s, l) => s + l.quantity * (l.creditPerUnit ?? 0),
                      0
                    );
                    const statusColor = RETURN_STATUS_COLORS[ret.status] ?? "bg-gray-100 text-gray-500 border-gray-200";
                    return (
                      <div key={ret.id} className="px-5 py-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="text-sm font-mono font-semibold text-[#111]">
                                {ret.returnNumber ?? ret.id.slice(0, 8).toUpperCase()}
                              </span>
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusColor}`}>
                                {RETURN_STATUS_LABELS[ret.status] ?? ret.status}
                              </span>
                              {ret.rmaNumber && (
                                <span className="text-xs text-[#666] bg-[#F0EEE9] px-2 py-0.5 rounded font-mono">
                                  RMA: {ret.rmaNumber}
                                </span>
                              )}
                            </div>
                            <div className="space-y-0.5">
                              {ret.lines.map((rl) => (
                                <div key={rl.id} className="flex items-center gap-2 text-xs text-[#666]">
                                  <RotateCcw size={10} className="text-[#bbb] flex-shrink-0" />
                                  <span className="font-mono text-[#444]">
                                    {rl.poLine.item?.itemNumber ?? "—"}
                                  </span>
                                  <span>×{rl.quantity}</span>
                                  {rl.creditPerUnit != null && (
                                    <span className="text-green-700">
                                      ${(rl.quantity * rl.creditPerUnit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                            {ret.reason && (
                              <p className="text-xs text-[#999] mt-1">Reason: {ret.reason}</p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-2 flex-shrink-0">
                            {totalCredit > 0 && (
                              <span className="text-sm font-semibold text-green-700">
                                +${totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </span>
                            )}
                            {ret.status === "PENDING" && (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleUpdateReturnStatus(ret.id, "SENT")}
                                  disabled={updatingReturnId === ret.id}
                                  className="text-[10px] font-semibold px-2 py-1 rounded-lg border border-[#E5E3DE] hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors disabled:opacity-40"
                                >
                                  Mark Sent
                                </button>
                                <button
                                  onClick={() => handleDeleteReturn(ret.id)}
                                  className="p-1 rounded hover:bg-red-50 text-[#bbb] hover:text-red-500"
                                >
                                  <X size={13} />
                                </button>
                              </div>
                            )}
                            {ret.status === "SENT" && (
                              <button
                                onClick={() => handleUpdateReturnStatus(ret.id, "CREDITED")}
                                disabled={updatingReturnId === ret.id}
                                className="text-[10px] font-semibold px-2 py-1 rounded-lg border border-[#E5E3DE] hover:bg-green-50 hover:border-green-200 hover:text-green-700 transition-colors disabled:opacity-40"
                              >
                                {updatingReturnId === ret.id ? "Updating…" : "Mark Credited"}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Summary */}
            <div className="bg-white border border-[#E5E3DE] rounded-2xl p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#888] mb-4">
                Summary
              </p>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[#666]">Items</span>
                  <span className="font-semibold text-[#111]">
                    {po.lines.length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#666]">Units ordered</span>
                  <span className="font-semibold text-[#111]">
                    {totalOrdered}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#666]">Units received</span>
                  <span
                    className={`font-semibold ${totalReceived >= totalOrdered ? "text-green-600" : totalReceived > 0 ? "text-amber-600" : "text-[#999]"}`}
                  >
                    {totalReceived}/{totalOrdered}
                  </span>
                </div>
                <div className="border-t border-[#F0EEE9] pt-3 flex justify-between text-sm">
                  <span className="text-[#666]">Total Cost</span>
                  <span className="font-bold text-[#111]">
                    $
                    {totalCost.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="bg-white border border-[#E5E3DE] rounded-2xl p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#888] mb-4">
                Details
              </p>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-[10px] text-[#999] uppercase tracking-widest">
                    Vendor
                  </p>
                  <p className="text-[#111] font-semibold mt-0.5">
                    {po.vendor?.name ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-[#999] uppercase tracking-widest">
                    Created
                  </p>
                  <p className="text-[#666] mt-0.5">
                    {po.createdAt.toLocaleDateString()}
                  </p>
                </div>
                {po.notes && (
                  <div>
                    <p className="text-[10px] text-[#999] uppercase tracking-widest">
                      Notes
                    </p>
                    <p className="text-[#666] mt-0.5">{po.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Sales Order link */}
            <button
              onClick={() =>
                router.push(
                  `/projects/${projectId}/sales-orders/${salesOrderId}`,
                )
              }
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-[#111] border border-[#E5E3DE] bg-white hover:bg-[#F7F6F3] transition-colors"
            >
              <Package size={14} />
              View Sales Order
            </button>
          </div>
        </div>
      </div>

      {/* Log Shipment Modal */}
      {showLogShipment && (
        <LogShipmentModal
          po={po as SerializedPO}
          projectId={projectId}
          salesOrderId={salesOrderId}
          onSaved={async () => {
            await refresh();
            setShowLogShipment(false);
            showToastMsg("success", "Shipment logged");
          }}
          onCancel={() => setShowLogShipment(false)}
        />
      )}

      {/* Return Items Modal */}
      {showReturnModal && (() => {
        const returnedByLine: Record<string, number> = {};
        for (const ret of returns) {
          if (ret.status === "CANCELLED") continue;
          for (const rl of ret.lines) {
            returnedByLine[rl.poLineId] = (returnedByLine[rl.poLineId] ?? 0) + rl.quantity;
          }
        }
        const returnableLines = po.lines
          .filter((l) => l.item !== null)
          .map((l) => ({
            id: l.id,
            quantity: l.quantity,
            receivedQuantity: l.receivedQuantity,
            cost: l.cost,
            alreadyReturnedQuantity: returnedByLine[l.id] ?? 0,
            item: {
              itemNumber: l.item!.itemNumber,
              manufacturer: l.item!.manufacturer,
              description: l.item!.description,
            },
          }));
        return (
          <ReturnItemsModal
            projectId={projectId}
            poId={po.id}
            lines={returnableLines}
            onSaved={handleReturnSaved}
            onCancel={() => setShowReturnModal(false)}
          />
        );
      })()}
    </div>
  );
}

// ─── Log Shipment Modal ───────────────────────────────────────────────────────
function LogShipmentModal({
  po,
  projectId,
  salesOrderId,
  onSaved,
  onCancel,
}: {
  po: SerializedPO;
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
            receivedAt: new Date().toISOString(),
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
                  {l.item.itemNumber} — {l.receivedQuantity}/{l.quantity}{" "}
                  received
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
              <AlertCircle size={11} />
              {error}
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
