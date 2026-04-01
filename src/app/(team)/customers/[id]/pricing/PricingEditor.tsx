"use client";
// src/app/(team)/customers/[id]/pricing/PricingEditor.tsx
import { useState, useMemo } from "react";
import { CheckCircle2, AlertCircle, Search, ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 25;

type ItemRow = {
  id: string;
  itemNumber: string;
  manufacturer: string | null;
  cost: number | null;
  price: number | null;
  active: boolean;
  approved: boolean;
  eolDate: string | null;
  customerPrice: number | null;
};

export default function PricingEditor({
  customerId,
  items,
}: {
  customerId: string;
  items: ItemRow[];
}) {
  const [prices, setPrices] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      items.map((item) => [
        item.id,
        item.customerPrice != null
          ? String(item.customerPrice)
          : item.price != null
          ? String(item.price)
          : "",
      ])
    )
  );
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [dirty, setDirty] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? items.filter((i) => i.itemNumber.toLowerCase().includes(q)) : items;
  }, [items, search]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedItems = filteredItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  function handleSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleChange(itemId: string, value: string) {
    setPrices((prev) => ({ ...prev, [itemId]: value }));
    setDirty(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = Object.entries(prices)
        .filter(([, v]) => v !== "")
        .map(([itemId, price]) => ({ itemId, price: parseFloat(price) }))
        .filter(({ price }) => !isNaN(price));

      const res = await fetch(`/api/customers/${customerId}/pricing`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prices: payload }),
      });

      if (!res.ok) throw new Error();
      setDirty(false);
      showToast("success", "Prices saved");
    } catch {
      showToast("error", "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium shadow-lg border ${
          toast.type === "success"
            ? "bg-white border-green-200 text-green-700"
            : "bg-white border-red-200 text-red-600"
        }`}>
          {toast.type === "success" ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
          {toast.msg}
        </div>
      )}

      {/* Search */}
      <div className="relative mb-3">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#aaa]" />
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search by item number…"
          className="w-full text-sm border border-[#E5E3DE] rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-[#111] bg-white transition-colors"
        />
      </div>

      <div className="bg-white border border-[#E5E3DE] rounded-2xl overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-7 px-5 py-3 border-b border-[#F0EEE9]">
          {["Item #", "Manufacturer", "Cost", "List Price", "Customer Price", "Margin", "Status"].map((h) => (
            <div key={h} className="text-[10px] font-semibold uppercase tracking-widest text-[#999]">
              {h}
            </div>
          ))}
        </div>

        {pagedItems.length === 0 && (
          <div className="px-5 py-10 text-center text-sm text-[#aaa]">No items match your search.</div>
        )}
        {pagedItems.map((item) => {
          const customerPrice = parseFloat(prices[item.id] || "0") || 0;
          const margin =
            item.cost && customerPrice
              ? ((customerPrice - item.cost) / customerPrice) * 100
              : null;
          const hasCustomPrice = item.customerPrice != null && item.customerPrice !== item.price;

          return (
            <div
              key={item.id}
              className="grid grid-cols-7 px-5 py-3.5 border-b border-[#F7F6F3] last:border-0 items-center hover:bg-[#FAFAF9] transition-colors"
            >
              <div className="font-mono text-sm font-semibold text-[#111]">
                {item.itemNumber}
              </div>

              <div className="text-sm text-[#666]">
                {item.manufacturer ?? <span className="text-[#ccc]">—</span>}
              </div>

              <div className="text-sm text-[#999]">
                {item.cost != null
                  ? `$${item.cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                  : <span className="text-[#ccc]">—</span>
                }
              </div>

              <div className="text-sm text-[#999]">
                {item.price != null
                  ? `$${item.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                  : <span className="text-[#ccc]">—</span>
                }
              </div>

              <div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-[#999]">$</span>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={prices[item.id]}
                    onChange={(e) => handleChange(item.id, e.target.value)}
                    className={`w-24 text-sm border rounded-lg px-2 py-1 focus:outline-none focus:border-[#111] transition-colors ${
                      hasCustomPrice
                        ? "border-blue-300 bg-blue-50 text-blue-700"
                        : "border-[#E5E3DE]"
                    }`}
                  />
                </div>
              </div>

              <div>
                {margin != null ? (
                  <span className={`text-sm font-semibold ${
                    margin >= 20 ? "text-green-600" : margin >= 10 ? "text-amber-600" : "text-red-600"
                  }`}>
                    {margin.toFixed(1)}%
                  </span>
                ) : (
                  <span className="text-[#ccc] text-sm">—</span>
                )}
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {!item.active && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-red-50 text-red-500 rounded">
                    Inactive
                  </span>
                )}
                {item.eolDate && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded">
                    EOL
                  </span>
                )}
                {item.approved && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-green-50 text-green-600 rounded">
                    Approved
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3 px-1">
          <span className="text-xs text-[#999]">
            {filteredItems.length} items · page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-[#E5E3DE] bg-white hover:bg-[#F7F6F3] disabled:opacity-40 transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-[#E5E3DE] bg-white hover:bg-[#F7F6F3] disabled:opacity-40 transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Save bar */}
      <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 transition-all duration-200 ${
        dirty ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      }`}>
        <div className="flex items-center gap-4 bg-[#111] text-white px-6 py-3.5 rounded-2xl shadow-xl">
          <span className="text-sm">Unsaved changes</span>
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-sm font-semibold bg-white text-[#111] px-4 py-1.5 rounded-xl disabled:opacity-50 hover:bg-[#F7F6F3] transition-colors"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </>
  );
}
