"use client";
import { useState, useRef, Fragment, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Search,
  Zap,
  Package,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Pencil,
  ShoppingCart,
} from "lucide-react";
import GenerateQuoteModal from "@/app/components/team/projects/bom/GenerateQuoteModal";
import CreatePOModal from "@/app/components/team/purchase-orders/CreatePOModal";
import { BOM, BOMLine } from "@/types/bom";
import { Item } from "@/types/item";
import { calcBOMTotals } from "./actions";

const quoteStatusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  SENT: "bg-blue-100 text-blue-700",
  ACCEPTED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-600",
};

export default function BOMEditor({
  bom,
  items,
  projectId,
  customerPrices,
  projectBoms,
}: {
  bom: BOM;
  items: Item[];
  projectId: string;
  customerPrices: Record<string, number>;
  projectBoms: { id: string; name: string; lineCount: number; total: number }[];
}) {
  const router = useRouter();
  const [lines, setLines] = useState<BOMLine[]>(() =>
    bom.lines.map((l) => {
      const cost = l.costEach ?? l.item?.cost ?? 0;
      const sell = l.sellEach ?? 0;
      const derived =
        sell > 0 && sell > cost ? ((sell - cost) / sell) * 100 : 20;
      return { ...l, marginPct: parseFloat(derived.toFixed(2)) };
    }),
  );
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showCreatePO, setShowCreatePO] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saved, setSaved] = useState(true);
  const [itemSearch, setItemSearch] = useState("");
  const [showItemPicker, setShowItemPicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    new Set(),
  );
  const [claimedPOs, setClaimedPOs] = useState<
    { itemId: string; quantity: number; po: string; poNumber: string }[]
  >([]);

  const [editingSectionName, setEditingSectionName] = useState<string | null>(
    null,
  );
  const [editingSectionValue, setEditingSectionValue] = useState("");
  const [toast, setToast] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);
  const [addingToSection, setAddingToSection] = useState<string>(() => {
    const s = bom.lines[0]?.section ?? "General";
    return s;
  });
  const searchRef = useRef<HTMLInputElement>(null);
  const [tariff, setTariff] = useState<number>(0);
  const [globalMargin, setGlobalMargin] = useState<number>(20);
  const [sections, setSections] = useState<string[]>(() => {
    // derive existing sections from loaded lines, preserving order
    const seen = new Set<string>();
    const result: string[] = [];
    for (const l of bom.lines) {
      const s = l.section ?? "General";
      if (!seen.has(s)) {
        seen.add(s);
        result.push(s);
      }
    }
    return result.length > 0 ? result : ["General"];
  });
  const [newSectionName, setNewSectionName] = useState("");

  const allSections = sections;

  useEffect(() => {
    fetch(`/api/projects/${projectId}/purchase-orders/claimed-lines`)
      .then((r) => r.json())
      .then(setClaimedPOs);
    console.log("claimed lines", claimedPOs);
  }, [projectId]);

  function effectivePrice(
    itemId: string,
    standardPrice: number | null,
  ): number | null {
    return customerPrices[itemId] ?? standardPrice;
  }

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const filteredItems = items.filter(
    (i) =>
      !lines.some((l) => l.itemId === i.id) &&
      (i.itemNumber.toLowerCase().includes(itemSearch.toLowerCase()) ||
        (i.manufacturer ?? "")
          .toLowerCase()
          .includes(itemSearch.toLowerCase()) ||
        (i.category ?? "").toLowerCase().includes(itemSearch.toLowerCase())),
  );

  function commitSectionRename(oldName: string) {
    const newName = editingSectionValue.trim();
    setEditingSectionName(null);
    if (!newName || newName === oldName) return;
    setSections((prev) => prev.map((s) => (s === oldName ? newName : s)));
    setLines((prev) =>
      prev.map((l) => (l.section === oldName ? { ...l, section: newName } : l)),
    );
    if (addingToSection === oldName) setAddingToSection(newName);
    setSaved(false);
  }

  function addLine(item: Item) {
    const cost = item.cost ?? 0;
    const defaultMargin = 20;
    const sell =
      cost > 0
        ? cost / (1 - defaultMargin / 100)
        : (effectivePrice(item.id, item.price) ?? 0);
    const newLine: BOMLine = {
      id: `temp-${Date.now()}`,
      itemId: item.id,
      item,
      quantity: 1,
      notes: null,
      sortOrder: lines.length,
      section: addingToSection,
      costEach: item.cost,
      sellEach: sell,
      marginPct: defaultMargin,
    };
    setLines((prev) => [...prev, newLine]);
    setItemSearch("");
    setSaved(false);
  }

  function updateMarginFromSell(lineId: string, sell: number | null) {
    setLines((prev) =>
      prev.map((l) => {
        if (l.id !== lineId) return l;
        const cost = l.costEach ?? l.item.cost ?? 0;
        const s = sell ?? 0;
        const m = s > 0 ? ((s - cost) / s) * 100 : 0;
        return { ...l, sellEach: sell, marginPct: parseFloat(m.toFixed(2)) };
      }),
    );
    setSaved(false);
  }

  function updateSellFromMargin(lineId: string, margin: number | null) {
    setLines((prev) =>
      prev.map((l) => {
        if (l.id !== lineId) return l;
        const cost = l.costEach ?? l.item.cost ?? 0;
        const m = margin ?? 0;
        const sell = m >= 100 ? cost : cost / (1 - m / 100);
        return {
          ...l,
          marginPct: margin,
          sellEach: parseFloat(sell.toFixed(2)),
        };
      }),
    );
    setSaved(false);
  }

  function applyMarginToAll(margin: number) {
    setLines((prev) =>
      prev.map((l) => {
        const cost = l.costEach ?? l.item?.cost ?? 0;
        if (cost <= 0) return l;
        const m = margin >= 100 ? 99.99 : margin;
        const sell = cost / (1 - m / 100);
        return {
          ...l,
          marginPct: margin,
          sellEach: parseFloat(sell.toFixed(2)),
        };
      }),
    );
    setSaved(false);
  }

  function updateField(lineId: string, field: keyof BOMLine, value: unknown) {
    setLines((prev) =>
      prev.map((l) => (l.id === lineId ? { ...l, [field]: value } : l)),
    );
    setSaved(false);
  }

  function removeLine(lineId: string) {
    setLines((prev) => prev.filter((l) => l.id !== lineId));
    setSaved(false);
  }

  function toggleSection(section: string) {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      next.has(section) ? next.delete(section) : next.add(section);
      return next;
    });
  }

  const linesBySection = allSections.reduce<Record<string, BOMLine[]>>(
    (acc, s) => {
      acc[s] = lines.filter((l) => (l.section ?? "Other") === s);
      return acc;
    },
    {},
  );

  // Totals
  const { totalHardwareSell, totalServiceSell, totalCostAll, grandTotal, gm } =
    calcBOMTotals(lines, customerPrices, tariff);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/boms/${bom.id}/lines`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lines: lines.map((l, i) => ({
              itemId: l.itemId,
              quantity: l.quantity,
              unit: l.unit,
              notes: l.notes,
              section: l.section ?? "Other",
              costEach: l.costEach,
              sellEach: l.sellEach,
              sortOrder: i,
              marginPct: l.marginPct,
            })),
            tariff,
          }),
        },
      );
      if (!res.ok) throw new Error();
      setSaved(true);
      showToast("success", "BOM saved");
      router.refresh();
    } catch {
      showToast("error", "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  function updateCost(lineId: string, cost: number | null) {
    setLines((prev) =>
      prev.map((l) => {
        if (l.id !== lineId) return l;
        const m = l.marginPct ?? 20;
        const c = cost ?? 0;
        const sell = m >= 100 ? c : c / (1 - m / 100);
        return { ...l, costEach: cost, sellEach: parseFloat(sell.toFixed(2)) };
      }),
    );
    setSaved(false);
  }

  async function handleGenerateQuote() {
    if (!saved) {
      showToast("error", "Save the BOM before generating a quote");
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/boms/${bom.id}/generate-quote`,
        { method: "POST" },
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      router.push(`/projects/${projectId}/quotes/${data.quoteId}`);
    } catch {
      showToast("error", "Failed to generate proposal");
      setGenerating(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/boms/${bom.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      router.push(`/projects/${projectId}`);
    } catch {
      showToast("error", "Failed to delete BOM");
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  return (
    <div className="bg-[#F7F6F3]">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium shadow-lg border transition-all ${
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

      {showGenerateModal && (
        <GenerateQuoteModal
          boms={projectBoms}
          projectId={projectId}
          onClose={() => setShowGenerateModal(false)}
        />
      )}

      {showCreatePO && (
        <CreatePOModal
          projectId={projectId}
          lines={lines.map((l) => ({
            id: l.id,
            description: l.item.description ?? l.item.itemNumber,
            quantity: l.quantity,
            price: l.sellEach ?? 0,
            cost: l.costEach ?? l.item.cost ?? null,
            item: {
              id: l.item.id,
              itemNumber: l.item.itemNumber,
              manufacturer: l.item.manufacturer ?? null,
            },
          }))}
          onClose={() => setShowCreatePO(false)}
        />
      )}

      {/* Delete Confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-[#E5E3DE] p-6 max-w-sm w-full mx-4">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center mb-4">
              <Trash2 size={18} className="text-red-500" />
            </div>
            <h2 className="text-base font-bold text-[#111] mb-1">
              Delete BOM?
            </h2>
            <p className="text-sm text-[#666] mb-1">
              <span className="font-semibold text-[#111]">{bom.name}</span> will
              be permanently deleted.
            </p>
            {bom.quotes.length > 0 && (
              <p className="text-sm text-amber-600 bg-amber-50 rounded-xl px-3 py-2 mt-3">
                ⚠️ This BOM has {bom.quotes.length} generated quote
                {bom.quotes.length !== 1 ? "s" : ""}. They will remain but will
                no longer be linked.
              </p>
            )}
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 text-sm font-semibold px-4 py-2.5 rounded-xl border border-[#E5E3DE] hover:bg-[#F7F6F3] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 text-sm font-semibold px-4 py-2.5 rounded-xl bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {deleting ? "Deleting…" : "Delete BOM"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-[#666] hover:text-[#111] mb-6 transition-colors"
        >
          <ArrowLeft size={15} />
          {bom.project.name}
        </button>

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#999] mb-1">
              <span>{bom.project.customer.name}</span>
              <span>·</span>
              <span>{bom.project.name}</span>
            </div>
            <h1 className="text-2xl font-bold text-[#111] tracking-tight">
              {bom.name}
            </h1>
            <p className="text-sm text-[#888] mt-1">
              {lines.length} item{lines.length !== 1 ? "s" : ""}
              {!saved && (
                <span className="text-amber-600 ml-2">· Unsaved changes</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-[#E5E3DE] bg-white hover:bg-red-50 hover:border-red-200 text-[#ccc] hover:text-red-500 transition-colors"
              title="Delete BOM"
            >
              <Trash2 size={15} />
            </button>
            <button
              onClick={handleSave}
              disabled={saving || saved}
              className="text-sm font-semibold px-4 py-2 rounded-xl border border-[#E5E3DE] bg-white hover:bg-[#F7F6F3] disabled:opacity-40 transition-colors"
            >
              {saving ? "Saving…" : saved ? "Saved ✓" : "Save Changes"}
            </button>
            <button
              onClick={() => setShowCreatePO(true)}
              disabled={lines.length === 0}
              className="flex items-center gap-2 bg-white border border-[#E5E3DE] text-[#111] text-sm font-semibold px-4 py-2 rounded-xl hover:bg-[#F7F6F3] disabled:opacity-40 transition-colors"
            >
              <ShoppingCart size={14} />
              Create PO
            </button>
            <button
              onClick={() => setShowGenerateModal(true)}
              disabled={lines.length === 0}
              className="flex items-center gap-2 bg-[#111] text-white text-sm font-semibold px-5 py-2 rounded-xl hover:bg-[#333] disabled:opacity-40 transition-colors max-w-sm"
            >
              <Zap size={14} />
              {generating ? "Generating…" : "Generate Proposal, Sales Order, or Change Order"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-6">
          {/* Main table — left 3/4 */}
          <div className="col-span-3 space-y-4">
            {/* Add Item */}
            <div className="bg-white border border-[#E5E3DE] rounded-2xl">
              <div className="px-5 py-4 border-b border-[#F0EEE9] flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#888]">
                  Add Item
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newSectionName}
                    onChange={(e) => setNewSectionName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newSectionName.trim()) {
                        const name = newSectionName.trim();
                        if (!sections.includes(name)) {
                          setSections((prev) => [...prev, name]);
                          setAddingToSection(name);
                        }
                        setNewSectionName("");
                      }
                    }}
                    placeholder="New section…"
                    className="text-xs border border-[#E5E3DE] rounded-lg px-2 py-1 focus:outline-none focus:border-[#111] w-28"
                  />
                  <span className="text-xs text-[#999]">Add to:</span>
                  <select
                    value={addingToSection}
                    onChange={(e) => setAddingToSection(e.target.value)}
                    className="text-xs border border-[#E5E3DE] rounded-lg px-2 py-1 focus:outline-none focus:border-[#111]"
                  >
                    {sections.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-4 relative">
                <div className="relative">
                  <Search
                    size={14}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#bbb]"
                  />
                  <input
                    ref={searchRef}
                    type="text"
                    value={itemSearch}
                    onChange={(e) => {
                      setItemSearch(e.target.value);
                      setShowItemPicker(true);
                    }}
                    onFocus={() => setShowItemPicker(true)}
                    placeholder="Search by part #, manufacturer, or category…"
                    className="w-full pl-9 pr-4 py-2.5 border border-[#E5E3DE] rounded-xl text-sm text-[#111] placeholder:text-[#bbb] focus:outline-none focus:border-[#111] transition-colors"
                  />
                </div>
                {showItemPicker && itemSearch && (
                  <div
                    className="absolute left-4 right-4 top-full mt-1 bg-white border border-[#E5E3DE] rounded-xl shadow-lg z-20 max-h-64 overflow-y-auto"
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    {filteredItems.length === 0 ? (
                      <p className="text-sm text-[#999] px-4 py-3">
                        No matching items
                      </p>
                    ) : (
                      filteredItems.slice(0, 20).map((item) => (
                        <button
                          key={item.id}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            addLine(item);
                            setShowItemPicker(false);
                            setItemSearch("");
                          }}
                          className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-[#F7F6F3] transition-colors text-left border-b border-[#F0EEE9] last:border-0"
                        >
                          <div>
                            <span className="text-sm font-medium text-[#111]">
                              {item.manufacturer && (
                                <span className="text-[#999] mr-1">
                                  {item.manufacturer}
                                </span>
                              )}
                              {item.itemNumber}
                            </span>
                            {item.description && (
                              <span className="text-xs text-[#bbb] ml-2">
                                {item.description}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-[#999]">
                            {item.category && (
                              <span className="bg-[#F0EEE9] px-2 py-0.5 rounded-md">
                                {item.category}
                              </span>
                            )}
                            <span className="text-[10px] bg-[#F0EEE9] px-2 py-0.5 rounded-md">
                              {item.type}
                            </span>
                            {item.price != null && (
                              <span className="font-medium text-[#111]">
                                ${item.price.toLocaleString()}
                              </span>
                            )}
                            <Plus size={13} className="text-[#111]" />
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* BOM Table */}
            <div className="bg-white border border-[#E5E3DE] rounded-2xl overflow-x-auto">
              {lines.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Package size={32} className="text-[#ddd] mb-3" />
                  <p className="text-sm font-medium text-[#999]">
                    No items yet
                  </p>
                  <p className="text-xs text-[#bbb] mt-1">
                    Search above to add items to this BOM
                  </p>
                </div>
              ) : (
                <table className="w-full text-sm min-w-[900px]">
                  <thead>
                    <tr className="border-b border-[#F0EEE9] bg-[#FAFAF8]">
                      <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-[#999] px-4 py-3 w-8" />
                      <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-[#999] px-3 py-3">
                        Manufacturer
                      </th>
                      <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-[#999] px-3 py-3">
                        Part #
                      </th>
                      <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-[#999] px-3 py-3">
                        Description / Notes
                      </th>
                      <th className="text-right text-[10px] font-semibold uppercase tracking-widest text-[#999] px-3 py-3 w-16">
                        Qty
                      </th>
                      <th className="text-right text-[10px] font-semibold uppercase tracking-widest text-[#999] px-3 py-3 w-16">
                        Margin
                      </th>
                      <th className="text-right text-[10px] font-semibold uppercase tracking-widest text-[#999] px-3 py-3 w-24">
                        Cost Ea.
                      </th>
                      <th className="text-right text-[10px] font-semibold uppercase tracking-widest text-[#999] px-3 py-3 w-24">
                        Cost Ext.
                      </th>
                      <th className="text-right text-[10px] font-semibold uppercase tracking-widest text-[#999] px-3 py-3 w-24">
                        Sell Ea.
                      </th>
                      <th className="text-right text-[10px] font-semibold uppercase tracking-widest text-[#999] px-4 py-3 w-24">
                        Sell Ext.
                      </th>
                      <th className="w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {allSections.map((section) => {
                      const sectionLines = linesBySection[section] ?? [];
                      if (sectionLines.length === 0) return null;
                      const collapsed = collapsedSections.has(section);
                      const sectionSellTotal = sectionLines.reduce(
                        (sum, l) =>
                          sum +
                          (l.sellEach ??
                            effectivePrice(l.itemId, l.item.price) ??
                            0) *
                            l.quantity,
                        0,
                      );

                      return (
                        <Fragment key={section}>
                          {/* Section header row */}
                          <tr className="bg-[#F7F6F3] border-b border-t border-[#E5E3DE] select-none">
                            <td colSpan={2} className="px-4 py-2">
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => toggleSection(section)}
                                  className="focus:outline-none"
                                >
                                  {collapsed ? (
                                    <ChevronRight
                                      size={13}
                                      className="text-[#999]"
                                    />
                                  ) : (
                                    <ChevronDown
                                      size={13}
                                      className="text-[#999]"
                                    />
                                  )}
                                </button>

                                {editingSectionName === section ? (
                                  <input
                                    autoFocus
                                    value={editingSectionValue}
                                    onChange={(e) =>
                                      setEditingSectionValue(e.target.value)
                                    }
                                    onBlur={() => commitSectionRename(section)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter")
                                        commitSectionRename(section);
                                      if (e.key === "Escape")
                                        setEditingSectionName(null);
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-xs font-bold uppercase tracking-widest text-[#555] bg-white border border-[#E5E3DE] rounded px-2 py-0.5 focus:outline-none focus:border-[#111] w-36"
                                  />
                                ) : (
                                  <button
                                    className="flex items-center gap-1.5 group focus:outline-none"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingSectionName(section);
                                      setEditingSectionValue(section);
                                    }}
                                  >
                                    <span className="text-xs font-bold uppercase tracking-widest text-[#555]">
                                      {section}
                                    </span>
                                    <Pencil
                                      size={11}
                                      className="text-[#bbb] opacity-0 group-hover:opacity-100 transition-opacity"
                                    />
                                  </button>
                                )}

                                <span className="text-[10px] text-[#bbb] ml-1">
                                  {sectionLines.length} item
                                  {sectionLines.length !== 1 ? "s" : ""}
                                </span>
                              </div>
                            </td>
                            <td colSpan={7} className="px-3 py-2 text-right">
                              <span className="text-xs font-semibold text-[#888]">
                                $
                                {sectionSellTotal.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                })}
                              </span>
                            </td>
                            <td />
                          </tr>

                          {/* Section lines */}
                          {!collapsed &&
                            sectionLines.map((line) => {
                              const costEach =
                                line.costEach ?? line.item.cost ?? 0;
                              const sellEach =
                                line.sellEach ??
                                effectivePrice(line.itemId, line.item.price) ??
                                0;
                              const costExt = costEach * line.quantity;
                              const sellExt = sellEach * line.quantity;

                              return (
                                <tr
                                  key={line.id}
                                  className="border-b border-[#F7F6F3] last:border-0 group hover:bg-[#FAFAF8]"
                                >
                                  {/* Drag handle */}
                                  <td className="px-2 py-2 text-[#ddd] cursor-grab">
                                    <GripVertical size={13} />
                                  </td>
                                  {/* Manufacturer */}
                                  <td className="px-3 py-2">
                                    <span className="text-xs text-[#666]">
                                      {line.item.manufacturer ?? "—"}
                                    </span>
                                  </td>
                                  {/* Part # */}
                                  <td className="px-3 py-2">
                                    <span className="text-xs font-mono font-semibold text-[#111]">
                                      {line.item.itemNumber}
                                    </span>
                                  </td>
                                  {/* Description + Notes */}
                                  <td className="px-3 py-2 min-w-[180px]">
                                    {line.item.description && (
                                      <p className="text-xs text-[#444] mb-1">
                                        {line.item.description}
                                      </p>
                                    )}
                                    <input
                                      type="text"
                                      value={line.notes ?? ""}
                                      onChange={(e) =>
                                        updateField(
                                          line.id,
                                          "notes",
                                          e.target.value,
                                        )
                                      }
                                      placeholder="Add note…"
                                      className="w-full text-xs text-[#666] placeholder:text-[#ccc] focus:outline-none border-0 bg-transparent border-b border-transparent focus:border-[#E5E3DE] transition-colors py-0.5"
                                    />
                                  </td>
                                  {/* Qty */}
                                  <td className="px-3 py-2 text-right">
                                    <div className="inline-flex flex-col items-end gap-0.5">
                                      <div className="flex items-center gap-1.5 bg-[#F7F6F3] border border-[#E5E3DE] rounded-lg px-2 py-1 focus-within:border-[#111] focus-within:bg-white transition-colors">
                                        <input
                                          type="number"
                                          value={line.quantity}
                                          onChange={(e) => {
                                            const v = parseInt(
                                              e.target.value,
                                              10,
                                            );
                                            updateField(
                                              line.id,
                                              "quantity",
                                              Number.isNaN(v) ? 0 : v,
                                            );
                                          }}
                                          className="w-12 text-right text-xs bg-transparent focus:outline-none tabular-nums"
                                        />
                                        {line.unit && (
                                          <span className="text-xs text-[#999] font-medium shrink-0">
                                            {line.unit}
                                          </span>
                                        )}
                                      </div>
                                      {!line.unit && (
                                        <p className="text-[10px] italic text-[#BBB]">
                                          no unit
                                        </p>
                                      )}
                                    </div>
                                  </td>

                                  {/* Margin % */}
                                  <td className="px-3 py-2 text-right">
                                    <div className="relative">
                                      <input
                                        type="number"
                                        step="0.1"
                                        min={0}
                                        max={99.9}
                                        value={line.marginPct ?? ""}
                                        onChange={(e) =>
                                          updateSellFromMargin(
                                            line.id,
                                            e.target.value === ""
                                              ? null
                                              : parseFloat(e.target.value),
                                          )
                                        }
                                        placeholder="20"
                                        className="w-16 text-right text-xs border border-[#E5E3DE] rounded-lg pr-5 pl-2 py-1 focus:outline-none focus:border-[#111] text-blue-600 font-medium transition-colors"
                                      />
                                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[#bbb] text-xs">
                                        %
                                      </span>
                                    </div>
                                  </td>

                                  {/* Cost Ea. */}
                                  <td className="px-3 py-2 text-right">
                                    <div className="relative">
                                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[#bbb] text-xs">
                                        $
                                      </span>
                                      <input
                                        type="number"
                                        step="0.01"
                                        min={0}
                                        value={
                                          costEach === 0 &&
                                          line.costEach == null
                                            ? ""
                                            : costEach
                                        }
                                        onChange={(e) =>
                                          updateCost(
                                            line.id,
                                            e.target.value === ""
                                              ? null
                                              : parseFloat(e.target.value),
                                          )
                                        }
                                        placeholder="0.00"
                                        className="w-20 text-right text-xs border border-[#E5E3DE] rounded-lg pl-5 pr-2 py-1 focus:outline-none focus:border-[#111] transition-colors"
                                      />
                                    </div>
                                  </td>
                                  {/* Cost Ext. */}
                                  <td className="px-3 py-2 text-right text-xs text-[#999]">
                                    $
                                    {costExt.toLocaleString(undefined, {
                                      minimumFractionDigits: 2,
                                    })}
                                  </td>
                                  {/* Sell Ea. */}
                                  <td className="px-3 py-2 text-right">
                                    <div className="relative">
                                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[#bbb] text-xs">
                                        $
                                      </span>
                                      <input
                                        type="number"
                                        step="0.01"
                                        min={0}
                                        value={
                                          sellEach === 0 &&
                                          line.sellEach == null
                                            ? ""
                                            : sellEach
                                        }
                                        onChange={(e) =>
                                          updateMarginFromSell(
                                            line.id,
                                            e.target.value === ""
                                              ? null
                                              : parseFloat(e.target.value),
                                          )
                                        }
                                        placeholder="0.00"
                                        className="w-20 text-right text-xs border border-[#E5E3DE] rounded-lg pl-5 pr-2 py-1 focus:outline-none focus:border-[#111] transition-colors"
                                      />
                                    </div>
                                  </td>
                                  {/* Sell Ext. */}
                                  <td className="px-4 py-2 text-right text-xs font-semibold text-[#111]">
                                    $
                                    {sellExt.toLocaleString(undefined, {
                                      minimumFractionDigits: 2,
                                    })}
                                  </td>
                                  {/* Delete */}
                                  <td className="pr-2">
                                    <button
                                      onClick={() => removeLine(line.id)}
                                      className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded-lg hover:bg-red-50 text-[#ccc] hover:text-red-500 transition-all"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Bulk margin */}
            <div className="bg-white border border-[#E5E3DE] rounded-2xl p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#888] mb-3">
                Margin
              </p>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="number"
                    step="0.1"
                    min={0}
                    max={99}
                    value={globalMargin}
                    onChange={(e) =>
                      setGlobalMargin(parseFloat(e.target.value) || 0)
                    }
                    className="w-full text-right text-sm border border-[#E5E3DE] rounded-lg pr-6 pl-3 py-1.5 focus:outline-none focus:border-[#111] transition-colors"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[#bbb] text-xs">
                    %
                  </span>
                </div>
                <button
                  onClick={() => applyMarginToAll(globalMargin)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-[#1a1a1a] text-white hover:bg-[#333] transition-colors whitespace-nowrap"
                >
                  Apply to all
                </button>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-white border border-[#E5E3DE] rounded-2xl p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#888] mb-4">
                Summary
              </p>
              <div className="space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-[#666]">Total Hardware</span>
                  <span className="font-semibold text-[#111]">
                    $
                    {totalHardwareSell.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>

                {/* Tariff line */}
                {/* <div className="flex justify-between text-sm items-center">
                  <span className="text-[#666]">Tariff</span>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[#bbb] text-xs">
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      value={tariff || ""}
                      onChange={(e) => {
                        setTariff(parseFloat(e.target.value) || 0);
                        setSaved(false);
                      }}
                      placeholder="0.00"
                      className="w-24 text-right text-xs border border-[#E5E3DE] rounded-lg pl-5 pr-2 py-1 focus:outline-none focus:border-[#111] transition-colors"
                    />
                  </div>
                </div> */}

                <div className="flex justify-between text-sm">
                  <span className="text-[#666]">Total Services</span>
                  <span className="font-semibold text-[#111]">
                    $
                    {totalServiceSell.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>

                <div className="border-t border-[#F0EEE9] pt-2.5 flex justify-between text-sm">
                  <span className="font-bold text-[#111]">Total</span>
                  <span className="font-bold text-[#111]">
                    $
                    {grandTotal.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>

                <div className="flex justify-between text-sm pt-1">
                  <span className="text-[#666]">GM</span>
                  <span
                    className={`font-bold ${gm >= 30 ? "text-green-600" : gm >= 15 ? "text-amber-600" : "text-red-600"}`}
                  >
                    {grandTotal > 0 ? `${gm.toFixed(1)}%` : "—"}
                  </span>
                </div>
              </div>
            </div>

            {/* Cost breakdown */}
            <div className="bg-white border border-[#E5E3DE] rounded-2xl p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#888] mb-4">
                Cost Breakdown
              </p>
              <div className="space-y-2">
                {allSections.map((section) => {
                  const sLines = linesBySection[section] ?? [];
                  if (sLines.length === 0) return null;
                  const total = sLines.reduce(
                    (s, l) =>
                      s +
                      (l.sellEach ??
                        effectivePrice(l.itemId, l.item.price) ??
                        0) *
                        l.quantity,
                    0,
                  );
                  return (
                    <div key={section} className="flex justify-between text-xs">
                      <span className="text-[#888]">{section}</span>
                      <span className="font-semibold text-[#111]">
                        $
                        {total.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quotes */}
            <div className="bg-white border border-[#E5E3DE] rounded-2xl p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#888] mb-4">
                Proposals from this BOM
              </p>
              {bom.quotes.length === 0 ? (
                <p className="text-sm text-[#bbb]">
                  No proposals generated yet
                </p>
              ) : (
                <div className="space-y-2">
                  {bom.quotes.map((q) => (
                    <a
                      key={q.id}
                      href={`/projects/${projectId}/quotes/${q.id}`}
                      className="flex items-center justify-between p-3 border border-[#F0EEE9] rounded-xl hover:border-[#E5E3DE] hover:bg-[#F7F6F3] transition-all"
                    >
                      <div>
                        <p className="text-xs font-mono font-semibold text-[#111]">
                          #{q.id.toUpperCase()}
                        </p>
                        <p className="text-[10px] text-[#999] mt-0.5">
                          {new Date(q.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {q.total != null && (
                          <span className="text-xs font-semibold text-[#111]">
                            ${q.total.toLocaleString()}
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${quoteStatusColors[q.status]}`}
                        >
                          {q.status}
                        </span>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Purchase Orders */}
            <div className="bg-white border border-[#E5E3DE] rounded-2xl p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#888] mb-4">
                Purchase Orders
              </p>
              {claimedPOs.length === 0 ? (
                <p className="text-sm text-[#bbb]">No POs created yet</p>
              ) : (
                <div className="space-y-2">
                  {/* deduplicate by PO */}
                  {Array.from(
                    new Map(claimedPOs.map((p) => [p.po, p])).values(),
                  ).map((po) => {
                    const poItems = claimedPOs.filter((p) => p.po === po.po);
                    return (
                      <a
                        key={po.po}
                        href={`/projects/${projectId}/purchase-orders/${po.po}`}
                        className="flex items-center justify-between p-3 border border-[#F0EEE9] rounded-xl hover:border-[#E5E3DE] hover:bg-[#F7F6F3] transition-all"
                      >
                        <div>
                          <p className="text-xs font-mono font-semibold text-[#111]">
                            {po.poNumber}
                          </p>
                          <p className="text-[10px] text-[#999] mt-0.5">
                            {poItems.length} line
                            {poItems.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <ShoppingCart size={13} className="text-[#bbb]" />
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showItemPicker && (
        <div
          className="fixed inset-0"
          onClick={() => setShowItemPicker(false)}
        />
      )}
    </div>
  );
}
