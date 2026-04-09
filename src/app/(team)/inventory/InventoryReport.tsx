"use client";
import React, { useState } from "react";
import {
  Package,
  ChevronDown,
  ChevronRight,
  ArrowDownCircle,
  ArrowUpCircle,
  SlidersHorizontal,
} from "lucide-react";

type Movement = {
  id: string;
  type:
    | "RECEIPT"
    | "BOM_ALLOCATION"
    | "ADJUSTMENT"
    | "RETURN_TO_VENDOR"
    | "RETURN_TO_INVENTORY";
  quantityDelta: number;
  notes: string | null;
  createdAt: string;
  invoiceNumber: string | null;
  purchaseOrderNumber: string | null;
  projectId: string | null;
  projectName: string | null;
  costAmount: number | null;
};

type ItemRow = {
  id: string;
  itemNumber: string;
  description: string | null;
  manufacturer: string | null;
  type: string;
  unit: string | null;
  unitCost: number | null;
  onHand: number;
  totalReceived: number;
  totalAllocated: number;
  lastMovementAt: string;
  movements: Movement[];
};

const MOVEMENT_CONFIG: Record<
  string,
  { label: string; color: string; delta: "+" | "−" | "±" }
> = {
  RECEIPT: { label: "Received", color: "text-green-600", delta: "+" },
  BOM_ALLOCATION: { label: "Allocated", color: "text-blue-600", delta: "−" },
  ADJUSTMENT: { label: "Adjustment", color: "text-amber-600", delta: "±" },
  RETURN_TO_INVENTORY: {
    label: "Return to Inventory",
    color: "text-purple-600",
    delta: "−",
  },
  RETURN_TO_VENDOR: {
    label: "Return to Vendor",
    color: "text-purple-600",
    delta: "+",
  },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function InventoryReport({ rows }: { rows: ItemRow[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<"all" | "low" | "out">("all");

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const filtered = rows.filter((r) => {
    if (filter === "low") return r.onHand > 0 && r.onHand <= 2;
    if (filter === "out") return r.onHand <= 0;
    return true;
  });

  const totalOnHand = rows.reduce((s, r) => s + r.onHand, 0);
  const outCount = rows.filter((r) => r.onHand <= 0).length;
  const lowCount = rows.filter((r) => r.onHand > 0 && r.onHand <= 2).length;

  return (
    <div className="bg-[#F7F6F3] min-h-screen">
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#111] tracking-tight">
              Inventory
            </h1>
            <p className="text-xs text-[#999] mt-1">
              On-hand quantities based on receipts and BOM allocations
            </p>
            <p className="text-xs text-[#bbb] mt-1">
              Inventory updates when shipments are received. Items are allocated
              to projects automatically via BOM.
            </p>
          </div>

          {/* Summary chips */}
          <div className="flex items-center gap-3">
            <div className="bg-white border border-[#E5E3DE] rounded-xl px-4 py-2.5 text-right">
              <p className="text-xs text-[#999] uppercase tracking-widest">
                Total On Hand
              </p>
              <p className="text-lg font-bold text-[#111]">{totalOnHand}</p>
            </div>
            {outCount > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-right">
                <p className="text-xs text-red-400 uppercase tracking-widest">
                  Out of Stock
                </p>
                <p className="text-lg font-bold text-red-600">{outCount}</p>
              </div>
            )}
            {lowCount > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-right">
                <p className="text-xs text-amber-500 uppercase tracking-widest">
                  Low Stock
                </p>
                <p className="text-lg font-bold text-amber-600">{lowCount}</p>
              </div>
            )}
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-2 mb-5">
          <SlidersHorizontal size={14} className="text-[#999]" />
          {(["all", "low", "out"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all ${
                filter === f
                  ? "bg-[#111] text-white border-[#111]"
                  : "bg-white text-[#666] border-[#E5E3DE] hover:bg-[#F7F6F3]"
              }`}
            >
              {f === "all"
                ? `All (${rows.length})`
                : f === "low"
                  ? `Low (${lowCount})`
                  : `Out (${outCount})`}
            </button>
          ))}
        </div>

        {rows.length === 0 ? (
          <div className="bg-white border border-[#E5E3DE] rounded-2xl px-8 py-16 text-center">
            <Package size={32} className="text-[#ddd] mx-auto mb-3" />
            <p className="text-sm font-semibold text-[#888]">
              No inventory movements yet
            </p>
            <p className="text-xs text-[#bbb] mt-1">
              Inventory updates automatically when shipments are received or
              invoices are created.
            </p>
          </div>
        ) : (
          <div className="bg-white border border-[#E5E3DE] rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#F0EEE9]">
                  <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-[#999] px-5 py-3">
                    Item
                  </th>
                  <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-[#999] px-3 py-3 hidden md:table-cell">
                    Manufacturer
                  </th>
                  <th className="text-right text-[10px] font-semibold uppercase tracking-widest text-[#999] px-3 py-3">
                    Received
                  </th>
                  <th className="text-right text-[10px] font-semibold uppercase tracking-widest text-[#999] px-3 py-3">
                    Allocated
                  </th>
                  <th className="text-right text-[10px] font-semibold uppercase tracking-widest text-[#999] px-5 py-3">
                    On Hand
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => {
                  const isExpanded = expanded.has(row.id);
                  const isOut = row.onHand <= 0;
                  const isLow = row.onHand > 0 && row.onHand <= 2;
                  return (
                    <React.Fragment key={row.id}>
                      <tr
                        onClick={() => toggle(row.id)}
                        className={`border-b border-[#F7F6F3] cursor-pointer transition-colors hover:bg-[#FAFAF9] ${
                          isExpanded ? "bg-[#FAFAF9]" : ""
                        }`}
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            {isExpanded ? (
                              <ChevronDown
                                size={13}
                                className="text-[#aaa] flex-shrink-0"
                              />
                            ) : (
                              <ChevronRight
                                size={13}
                                className="text-[#aaa] flex-shrink-0"
                              />
                            )}
                            <div>
                              <p className="text-xs font-mono font-semibold text-[#111]">
                                {row.itemNumber}
                              </p>
                              {row.description && (
                                <p className="text-xs text-[#888] mt-0.5 max-w-xs truncate">
                                  {row.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-xs text-[#666] hidden md:table-cell">
                          {row.manufacturer ?? "—"}
                        </td>
                        <td className="px-3 py-3 text-right">
                          <span className="text-xs font-semibold text-green-600">
                            +{row.totalReceived}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right">
                          <span className="text-xs font-semibold text-blue-600">
                            −{row.totalAllocated}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <span
                            className={`text-sm font-bold ${
                              isOut
                                ? "text-red-600"
                                : isLow
                                  ? "text-amber-600"
                                  : "text-[#111]"
                            }`}
                          >
                            {row.onHand}
                            {row.unit ? ` ${row.unit}` : ""}
                          </span>
                          {isOut && (
                            <span className="ml-1.5 text-[10px] font-semibold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full">
                              OUT
                            </span>
                          )}
                          {isLow && (
                            <span className="ml-1.5 text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
                              LOW
                            </span>
                          )}
                        </td>
                      </tr>

                      {/* Expanded movement history */}
                      {isExpanded && (
                        <tr
                          key={`${row.id}-history`}
                          className="border-b border-[#F7F6F3] bg-[#FAFAF9]"
                        >
                          <td colSpan={5} className="px-12 pb-4 pt-1">
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#bbb] mb-2">
                              Movement History
                            </p>
                            <div className="space-y-1.5">
                              {row.movements.map((m) => {
                                const cfg =
                                  MOVEMENT_CONFIG[m.type] ??
                                  MOVEMENT_CONFIG.ADJUSTMENT;
                                const isIn = m.quantityDelta > 0;
                                const isBomAlloc = m.type === "BOM_ALLOCATION";
                                return (
                                  <div
                                    key={m.id}
                                    className={`flex items-start gap-3 text-xs py-1 px-2 rounded-lg ${isBomAlloc ? "bg-blue-50/60" : ""}`}
                                  >
                                    {isIn ? (
                                      <ArrowDownCircle
                                        size={13}
                                        className="text-green-500 flex-shrink-0 mt-0.5"
                                      />
                                    ) : (
                                      <ArrowUpCircle
                                        size={13}
                                        className={`flex-shrink-0 mt-0.5 ${isBomAlloc ? "text-blue-500" : "text-red-400"}`}
                                      />
                                    )}
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 min-w-0">
                                      <span
                                        className={`font-semibold ${cfg.color}`}
                                      >
                                        {cfg.label}
                                      </span>
                                      <span className="font-mono font-semibold text-[#111]">
                                        {cfg.delta}
                                        {Math.abs(m.quantityDelta)}
                                      </span>
                                      {m.purchaseOrderNumber && (
                                        <span className="text-[#888] font-mono">
                                          PO {m.purchaseOrderNumber}
                                        </span>
                                      )}
                                      {isBomAlloc && m.projectName && (
                                        <span className="font-semibold text-blue-700">
                                          → {m.projectName}
                                        </span>
                                      )}
                                      {isBomAlloc && m.costAmount != null && (
                                        <span className="text-blue-600 font-mono">
                                          $
                                          {m.costAmount.toLocaleString(
                                            undefined,
                                            {
                                              minimumFractionDigits: 2,
                                              maximumFractionDigits: 2,
                                            },
                                          )}{" "}
                                          cost
                                        </span>
                                      )}
                                      {m.invoiceNumber && (
                                        <span className="text-[#888] font-mono">
                                          Inv #{m.invoiceNumber}
                                        </span>
                                      )}
                                      <span className="text-[#bbb]">
                                        {formatDate(m.createdAt)}
                                      </span>
                                      {m.notes && (
                                        <span className="text-[#aaa]">
                                          — {m.notes}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div className="px-8 py-10 text-center">
                <p className="text-sm text-[#888]">
                  No items match this filter.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
