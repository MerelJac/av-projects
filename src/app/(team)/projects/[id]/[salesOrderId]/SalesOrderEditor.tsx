"use client";
// src/app/projects/[id]/sales-orders/[salesOrderId]/SalesOrderEditor.tsx
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Trash2,
  Edit2,
  Check,
  ShoppingCart,
} from "lucide-react";
import { SalesOrderWithDetails } from "./page";
import { SalesOrderStatus } from "@prisma/client";

type SOLine = SalesOrderWithDetails["lines"][number];

const STATUS_CONFIG: Record<
  SalesOrderStatus,
  { label: string; color: string; icon: React.ReactNode }
> = {
  OPEN: {
    label: "Open",
    color: "bg-blue-100 text-blue-700",
    icon: <ShoppingCart size={13} />,
  },
  FULFILLED: {
    label: "Fulfilled",
    color: "bg-green-100 text-green-700",
    icon: <CheckCircle2 size={13} />,
  },
  CLOSED: {
    label: "Closed",
    color: "bg-gray-100 text-gray-600",
    icon: <XCircle size={13} />,
  },
};

export default function SalesOrderEditor({
  salesOrder: initialSO,
  projectId,
}: {
  salesOrder: SalesOrderWithDetails;
  projectId: string;
}) {
  const router = useRouter();
  const [lines, setLines] = useState<SOLine[]>(initialSO.lines);
  const [status, setStatus] = useState<SalesOrderStatus>(initialSO.status);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(true);
  const [editingLineId, setEditingLineId] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  function updateLine(lineId: string, updates: Partial<SOLine>) {
    setLines((prev) =>
      prev.map((l) => (l.id === lineId ? { ...l, ...updates } : l)),
    );
    setSaved(false);
  }

  function removeLine(lineId: string) {
    setLines((prev) => prev.filter((l) => l.id !== lineId));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/sales-orders/${initialSO.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lines, status }),
        },
      );
      if (!res.ok) throw new Error();
      setSaved(true);
      showToast("success", "Sales order saved");
      router.refresh();
    } catch {
      showToast("error", "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  // Financials
  const subtotal = lines.reduce(
    (s, l) => s + Number(l.price) * l.quantity,
    0,
  );
  const totalCost = lines.reduce(
    (s, l) => s + Number(l.cost ?? 0) * l.quantity,
    0,
  );
  const margin = subtotal > 0 ? ((subtotal - totalCost) / subtotal) * 100 : 0;

  const statusCfg = STATUS_CONFIG[status];

  return (
    <div className="min-h-screen bg-[#F7F6F3]">
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

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Back */}
        <button
          onClick={() => router.push(`/projects/${projectId}`)}
          className="flex items-center gap-2 text-sm text-[#666] hover:text-[#111] mb-6 transition-colors"
        >
          <ArrowLeft size={15} />
          {initialSO.project?.name ?? "Project"}
        </button>

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#999] mb-1">
              <span>{initialSO.customer.name}</span>
              {initialSO.quote && (
                <>
                  <span>·</span>
                  <span
                    className="cursor-pointer hover:text-[#111] transition-colors"
                    onClick={() =>
                      router.push(
                        `/projects/${projectId}/quotes/${initialSO.quote!.id}`,
                      )
                    }
                  >
                    from Quote #{initialSO.quote.id.slice(0, 8).toUpperCase()}
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-[#111] tracking-tight font-mono">
                SO-{initialSO.id.slice(0, 8).toUpperCase()}
              </h1>
              <span
                className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${statusCfg.color}`}
              >
                {statusCfg.icon}
                {statusCfg.label}
              </span>
            </div>
            {!saved && (
              <p className="text-xs text-amber-600 mt-1">Unsaved changes</p>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={saving || saved}
            className="text-sm font-semibold px-4 py-2 rounded-xl border border-[#E5E3DE] bg-white hover:bg-[#F7F6F3] disabled:opacity-40 transition-colors"
          >
            {saving ? "Saving…" : saved ? "Saved ✓" : "Save Changes"}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Lines */}
          <div className="col-span-2">
            <div className="bg-white border border-[#E5E3DE] rounded-2xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-[#F0EEE9] flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#888]">
                  Line Items
                </p>
                <p className="text-xs text-[#bbb]">{lines.length} items</p>
              </div>

              {lines.length === 0 ? (
                <p className="text-sm text-[#bbb] px-5 py-8 text-center">
                  No line items
                </p>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#F0EEE9]">
                      <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-[#999] px-5 py-3">
                        Description
                      </th>
                      <th className="text-right text-[10px] font-semibold uppercase tracking-widest text-[#999] px-3 py-3 w-20">
                        Qty
                      </th>
                      <th className="text-right text-[10px] font-semibold uppercase tracking-widest text-[#999] px-3 py-3 w-28">
                        Price
                      </th>
                      <th className="text-right text-[10px] font-semibold uppercase tracking-widest text-[#999] px-5 py-3 w-28">
                        Total
                      </th>
                      <th className="w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((line) => (
                      <SOLineRow
                        key={line.id}
                        line={line}
                        editing={editingLineId === line.id}
                        onEdit={() =>
                          setEditingLineId(
                            editingLineId === line.id ? null : line.id,
                          )
                        }
                        onUpdate={(u) => updateLine(line.id, u)}
                        onRemove={() => removeLine(line.id)}
                      />
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Financials */}
            <div className="bg-white border border-[#E5E3DE] rounded-2xl p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#888] mb-4">
                Financials
              </p>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[#666]">Subtotal</span>
                  <span className="font-semibold text-[#111]">
                    ${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#666]">Total Cost</span>
                  <span className="text-[#666]">
                    ${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="border-t border-[#F0EEE9] pt-3 flex justify-between text-sm">
                  <span className="text-[#666]">Margin</span>
                  <span
                    className={`font-bold text-base ${
                      margin >= 20
                        ? "text-green-600"
                        : margin >= 10
                          ? "text-amber-600"
                          : "text-red-600"
                    }`}
                  >
                    {margin.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="bg-white border border-[#E5E3DE] rounded-2xl p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#888] mb-4">
                Status
              </p>
              <div className="space-y-2">
                {(
                  Object.entries(STATUS_CONFIG) as [
                    SalesOrderStatus,
                    (typeof STATUS_CONFIG)[SalesOrderStatus],
                  ][]
                ).map(([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setStatus(key);
                      setSaved(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                      status === key
                        ? `${cfg.color} border-current`
                        : "text-[#666] border-transparent hover:bg-[#F7F6F3]"
                    }`}
                  >
                    {cfg.icon}
                    {cfg.label}
                    {status === key && <Check size={13} className="ml-auto" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Source quote link */}
            {initialSO.quote && (
              <div className="bg-white border border-[#E5E3DE] rounded-2xl p-5 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#888] mb-4">
                  Source
                </p>
                <button
                  onClick={() =>
                    router.push(
                      `/projects/${projectId}/quotes/${initialSO.quote!.id}`,
                    )
                  }
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-[#111] border border-[#E5E3DE] hover:bg-[#F7F6F3] transition-colors"
                >
                  <FileText size={14} />
                  View Original Quote
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Line Row ────────────────────────────────────────────────────────────────
function SOLineRow({
  line,
  editing,
  onEdit,
  onUpdate,
  onRemove,
}: {
  line: SOLine;
  editing: boolean;
  onEdit: () => void;
  onUpdate: (u: Partial<SOLine>) => void;
  onRemove: () => void;
}) {
  return (
    <tr className="border-b border-[#F7F6F3] last:border-0 group">
      <td className="px-5 py-3">
        {editing ? (
          <input
            type="text"
            value={line.description}
            onChange={(e) => onUpdate({ description: e.target.value })}
            className="w-full text-sm text-[#111] border border-[#E5E3DE] rounded-lg px-2 py-1 focus:outline-none focus:border-[#111]"
            autoFocus
          />
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#111]">{line.description}</span>
            <button
              onClick={onEdit}
              className="opacity-0 group-hover:opacity-100 text-[#ccc] hover:text-[#111] transition-all"
            >
              <Edit2 size={11} />
            </button>
          </div>
        )}
        {line.item && (
          <p className="text-[10px] text-[#bbb] mt-0.5 font-mono">
            {line.item.itemNumber}
          </p>
        )}
      </td>
      <td className="px-3 py-3 text-right">
        <input
          type="number"
          min={1}
          value={line.quantity}
          onChange={(e) =>
            onUpdate({ quantity: parseInt(e.target.value) || 1 })
          }
          className="w-14 text-right text-sm border border-[#E5E3DE] rounded-lg px-2 py-1 focus:outline-none focus:border-[#111]"
        />
      </td>
      <td className="px-3 py-3 text-right">
        <div className="flex items-center justify-end gap-0.5">
          <span className="text-xs text-[#999]">$</span>
          <input
            type="number"
            min={0}
            step={0.01}
            value={Number(line.price)}
            onChange={(e) =>
              onUpdate({ price: parseFloat(e.target.value) || 0 } as any)
            }
            className="w-20 text-right text-sm border border-[#E5E3DE] rounded-lg px-2 py-1 focus:outline-none focus:border-[#111]"
          />
        </div>
      </td>
      <td className="px-5 py-3 text-right text-sm font-semibold text-[#111]">
        ${(Number(line.price) * line.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}
      </td>
      <td className="pr-3">
        <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-all">
          <button
            onClick={onRemove}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-[#ccc] hover:text-red-500 transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </td>
    </tr>
  );
}
