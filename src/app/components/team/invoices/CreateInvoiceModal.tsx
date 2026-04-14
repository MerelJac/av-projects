"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, FileText, Percent, List, Plus, Trash2 } from "lucide-react";
type AdditionalLine = {
  id: string;
  description: string;
  amount: string;
  taxable: boolean;
};
type QuoteLine = {
  id: string;
  description: string;
  quantity: number;
  price: number;
  bundleId: string | null;
  item?: { taxStatus?: string | null } | null;
};
type Bundle = {
  id: string;
  name: string;
  showToCustomer: boolean;
  lines: QuoteLine[];
};
type Customer = {
  name: string;
  email?: string | null;
  phone?: string | null;
};
export default function CreateInvoiceModal({
  projectId,
  quoteId,
  lines,
  bundles,
  customer,
  quoteSubtotal,
  onClose,
}: {
  projectId: string;
  quoteId: string;
  lines: QuoteLine[];
  bundles: Bundle[];
  customer: Customer;
  quoteSubtotal: number;
  onClose: () => void;
}) {
  const router = useRouter();
  const [chargeType, setChargeType] = useState<"LINE_ITEMS" | "PERCENTAGE">(
    "LINE_ITEMS",
  );
  const [chargePercent, setChargePercent] = useState<string>("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [customerName, setCustomerName] = useState(customer.name);
  const [customerEmail, setCustomerEmail] = useState(customer.email ?? "");
  const [customerPhone, setCustomerPhone] = useState(customer.phone ?? "");
  const [billToAddress, setBillToAddress] = useState("");
  const [shipToAddress, setShipToAddress] = useState("");
  const [sameAsBilling, setSameAsBilling] = useState(false);
  const [billingTerms, setBillingTerms] = useState<
    "NET30" | "PROGRESS" | "PREPAID" | ""
  >("");
  const [notes, setNotes] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [additionalLines, setAdditionalLines] = useState<AdditionalLine[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lineTaxable, setLineTaxable] = useState<Record<string, boolean>>(
    () => {
      const init: Record<string, boolean> = {};
      for (const l of lines) init[l.id] = l.item?.taxStatus !== "EXEMPT";
      for (const b of bundles) {
        for (const l of b.lines) init[l.id] = l.item?.taxStatus !== "EXEMPT";
        init[`bundle:${b.id}`] = true;
      }
      return init;
    },
  );
  function toggleTaxable(key: string, e: React.MouseEvent) {
    e.stopPropagation();
    setLineTaxable((prev) => ({ ...prev, [key]: !prev[key] }));
  }
  function addAdditionalLine(description = "") {
    setAdditionalLines((prev) => [
      ...prev,
      { id: crypto.randomUUID(), description, amount: "", taxable: true },
    ]);
  }
  function updateAdditionalLine(
    id: string,
    field: "description" | "amount",
    value: string,
  ) {
    setAdditionalLines((prev) =>
      prev.map((l) => (l.id === id ? { ...l, [field]: value } : l)),
    );
  }
  function toggleAdditionalTaxable(id: string) {
    setAdditionalLines((prev) =>
      prev.map((l) => (l.id === id ? { ...l, taxable: !l.taxable } : l)),
    );
  }
  function removeAdditionalLine(id: string) {
    setAdditionalLines((prev) => prev.filter((l) => l.id !== id));
  }
  const additionalTotal = additionalLines.reduce(
    (s, l) => s + (parseFloat(l.amount) || 0),
    0,
  );
  // Unbundled lines
  const unbundledLines = lines.filter((l) => !l.bundleId);
  function toggleLine(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function toggleBundle(bundleId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(`bundle:${bundleId}`)) {
        next.delete(`bundle:${bundleId}`);
      } else {
        next.add(`bundle:${bundleId}`);
      }
      return next;
    });
  }
  function toggleBundleLine(lineId: string) {
    toggleLine(lineId);
  }
  // Build invoice lines from selections
  function buildLines() {
    const result: {
      description: string;
      quantity: number;
      price: number;
      taxable: boolean;
      quoteLineId?: string;
      quoteBundleId?: string;
      isBundleTotal?: boolean;
    }[] = [];
    for (const l of unbundledLines) {
      if (selected.has(l.id)) {
        result.push({
          description: l.description,
          quantity: l.quantity,
          price: l.price,
          taxable: lineTaxable[l.id] ?? true,
          quoteLineId: l.id,
        });
      }
    }
    for (const bundle of bundles) {
      if (bundle.showToCustomer) {
        for (const l of bundle.lines) {
          if (selected.has(l.id)) {
            result.push({
              description: l.description,
              quantity: l.quantity,
              price: l.price,
              taxable: lineTaxable[l.id] ?? true,
              quoteLineId: l.id,
              quoteBundleId: bundle.id,
            });
          }
        }
      } else {
        if (selected.has(`bundle:${bundle.id}`)) {
          const total = bundle.lines.reduce(
            (s, l) => s + l.price * l.quantity,
            0,
          );
          result.push({
            description: bundle.name,
            quantity: 1,
            price: total,
            taxable: lineTaxable[`bundle:${bundle.id}`] ?? true,
            quoteBundleId: bundle.id,
            isBundleTotal: true,
          });
        }
      }
    }
    return result;
  }
  const pctAmount =
    chargeType === "PERCENTAGE" && chargePercent
      ? (parseFloat(chargePercent) / 100) * quoteSubtotal
      : null;
  const lineItemsAmount =
    chargeType === "LINE_ITEMS"
      ? buildLines().reduce((s, l) => s + l.price * l.quantity, 0)
      : null;
  const previewAmount =
    (chargeType === "PERCENTAGE" ? (pctAmount ?? 0) : (lineItemsAmount ?? 0)) +
    additionalTotal;

  const resolvedShipTo = sameAsBilling ? billToAddress : shipToAddress;

  async function handleCreate() {
    setError(null);
    if (chargeType === "PERCENTAGE") {
      const pct = parseFloat(chargePercent);
      if (!chargePercent || isNaN(pct) || pct <= 0 || pct > 100) {
        setError("Enter a valid percentage (1–100).");
        return;
      }
    } else {
      const validAdditional = additionalLines.filter(
        (l) => l.description && parseFloat(l.amount) > 0,
      );
      if (selected.size === 0 && validAdditional.length === 0) {
        setError("Select at least one line item or add an additional charge.");
        return;
      }
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/invoices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteId,
          chargeType,
          chargePercent:
            chargeType === "PERCENTAGE" ? parseFloat(chargePercent) : undefined,
          lines: chargeType === "LINE_ITEMS" ? buildLines() : undefined,
          additionalLines: additionalLines
            .filter((l) => l.description && parseFloat(l.amount) > 0)
            .map((l) => ({
              description: l.description,
              amount: parseFloat(l.amount),
              taxable: l.taxable,
            })),
          customerName,
          customerEmail: customerEmail || null,
          customerPhone: customerPhone || null,
          billToAddress: billToAddress || null,
          shipToAddress: resolvedShipTo || null,
          billingTerms: billingTerms || null,
          notes: notes || null,
          dueDate: dueDate || null,
        }),
      });
      if (!res.ok) {
        const { error: msg } = await res.json();
        setError(msg ?? "Failed to create invoice.");
        return;
      }
      router.push(`/projects/${projectId}/invoices`);
      onClose();
    } catch {
      setError("Failed to create invoice.");
    } finally {
      setSaving(false);
    }
  }
  const fmt = (n: number) =>
    n.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-[#E5E3DE] w-[680px] max-h-[90vh] mx-4 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0EEE9]">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-[#888]" />
            <p className="text-sm font-semibold text-[#111]">Create Invoice</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#F7F6F3] text-[#999] hover:text-[#111] transition-colors"
          >
            <X size={14} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">
          {/* Charge type */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#888] mb-3">
              Charge Type
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setChargeType("LINE_ITEMS")}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                  chargeType === "LINE_ITEMS"
                    ? "bg-[#111] text-white border-[#111]"
                    : "text-[#666] border-[#E5E3DE] hover:bg-[#F7F6F3]"
                }`}
              >
                <List size={14} />
                Select Items
              </button>
              <button
                onClick={() => setChargeType("PERCENTAGE")}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                  chargeType === "PERCENTAGE"
                    ? "bg-[#111] text-white border-[#111]"
                    : "text-[#666] border-[#E5E3DE] hover:bg-[#F7F6F3]"
                }`}
              >
                <Percent size={14} />
                Percentage
              </button>
            </div>
          </div>
          {/* Percentage input */}
          {chargeType === "PERCENTAGE" && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#888] mb-3">
                Percentage of Quote
              </p>
              <div className="flex items-center gap-3">
                <div className="relative w-40">
                  <input
                    type="number"
                    min={1}
                    max={100}
                    step={0.1}
                    value={chargePercent}
                    onChange={(e) => setChargePercent(e.target.value)}
                    placeholder="50"
                    className="w-full text-sm border border-[#E5E3DE] rounded-xl px-3 py-2 pr-7 focus:outline-none focus:border-[#111]"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#999]">
                    %
                  </span>
                </div>
                {pctAmount != null && (
                  <p className="text-sm text-[#666]">
                    ={" "}
                    <span className="font-semibold text-[#111]">
                      ${fmt(pctAmount)}
                    </span>
                    <span className="text-[#bbb] ml-1">
                      of ${fmt(quoteSubtotal)}
                    </span>
                  </p>
                )}
              </div>
            </div>
          )}
          {/* Line item selection */}
          {chargeType === "LINE_ITEMS" && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#888] mb-3">
                Select Items to Invoice
              </p>
              <div className="space-y-3">
                {unbundledLines.length > 0 && (
                  <div className="border border-[#E5E3DE] rounded-xl overflow-hidden">
                    <div className="px-4 py-2.5 bg-[#FAFAF9] border-b border-[#F0EEE9]">
                      <p className="text-xs font-semibold text-[#888]">
                        Unbundled Items
                      </p>
                    </div>
                    {unbundledLines.map((l) => {
                      const checked = selected.has(l.id);
                      const taxable = lineTaxable[l.id] ?? true;
                      return (
                        <div
                          key={l.id}
                          onClick={() => toggleLine(l.id)}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#FAFAF9] cursor-pointer border-b border-[#F7F6F3] last:border-0"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleLine(l.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="rounded"
                          />
                          <span className="flex-1 text-sm text-[#111]">
                            {l.description}
                          </span>
                          <span className="text-xs text-[#888]">
                            ×{l.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => toggleTaxable(l.id, e)}
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-md transition-colors ${taxable ? "bg-green-50 text-green-600" : "bg-[#F7F6F3] text-[#999]"}`}
                          >
                            {taxable ? "Taxable" : "Exempt"}
                          </button>
                          <span className="text-sm font-medium text-[#111] w-20 text-right">
                            ${fmt(l.price * l.quantity)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
                {bundles.map((bundle) => {
                  const bundleTotal = bundle.lines.reduce(
                    (s, l) => s + l.price * l.quantity,
                    0,
                  );
                  if (!bundle.showToCustomer) {
                    const checked = selected.has(`bundle:${bundle.id}`);
                    return (
                      <div
                        key={bundle.id}
                        className="border border-[#E5E3DE] rounded-xl overflow-hidden"
                      >
                        <div
                          onClick={() => toggleBundle(bundle.id)}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-[#FAFAF9] cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleBundle(bundle.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="rounded"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-[#111]">
                              {bundle.name}
                            </p>
                            <p className="text-xs text-[#999] mt-0.5">
                              Hidden bundle · billed as total
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={(e) =>
                              toggleTaxable(`bundle:${bundle.id}`, e)
                            }
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-md transition-colors ${(lineTaxable[`bundle:${bundle.id}`] ?? true) ? "bg-green-50 text-green-600" : "bg-[#F7F6F3] text-[#999]"}`}
                          >
                            {(lineTaxable[`bundle:${bundle.id}`] ?? true)
                              ? "Tax"
                              : "Exempt"}
                          </button>
                          <span className="text-sm font-medium text-[#111] w-20 text-right">
                            ${fmt(bundleTotal)}
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div
                      key={bundle.id}
                      className="border border-[#E5E3DE] rounded-xl overflow-hidden"
                    >
                      <div className="px-4 py-2.5 bg-[#FAFAF9] border-b border-[#F0EEE9] flex items-center justify-between">
                        <p className="text-xs font-semibold text-[#888]">
                          {bundle.name}
                        </p>
                        <span className="text-xs text-[#bbb]">
                          ${fmt(bundleTotal)}
                        </span>
                      </div>
                      {bundle.lines.map((l) => {
                        const checked = selected.has(l.id);
                        const taxable = lineTaxable[l.id] ?? true;
                        return (
                          <div
                            key={l.id}
                            onClick={() => toggleBundleLine(l.id)}
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#FAFAF9] cursor-pointer border-b border-[#F7F6F3] last:border-0"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleBundleLine(l.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="rounded"
                            />
                            <span className="flex-1 text-sm text-[#111]">
                              {l.description}
                            </span>
                            <span className="text-xs text-[#888]">
                              ×{l.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => toggleTaxable(l.id, e)}
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md transition-colors ${taxable ? "bg-green-50 text-green-600" : "bg-[#F7F6F3] text-[#999]"}`}
                            >
                              {taxable ? "Tax" : "Exempt"}
                            </button>
                            <span className="text-sm font-medium text-[#111] w-20 text-right">
                              ${fmt(l.price * l.quantity)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {/* Additional charges */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#888] mb-3">
              Additional Charges
            </p>
            <div className="space-y-2">
              {additionalLines.map((line) => (
                <div key={line.id} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Tax, Shipping"
                    value={line.description}
                    onChange={(e) =>
                      updateAdditionalLine(
                        line.id,
                        "description",
                        e.target.value,
                      )
                    }
                    className="flex-1 text-sm border border-[#E5E3DE] rounded-xl px-3 py-2 focus:outline-none focus:border-[#111]"
                  />
                  <div className="relative w-32">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#999]">
                      $
                    </span>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      placeholder="0.00"
                      value={line.amount}
                      onChange={(e) =>
                        updateAdditionalLine(line.id, "amount", e.target.value)
                      }
                      className="w-full text-sm border border-[#E5E3DE] rounded-xl px-3 py-2 pl-6 focus:outline-none focus:border-[#111]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleAdditionalTaxable(line.id)}
                    className={`text-[10px] font-semibold px-2 py-1.5 rounded-md transition-colors whitespace-nowrap ${line.taxable ? "bg-green-50 text-green-600" : "bg-[#F7F6F3] text-[#999]"}`}
                  >
                    {line.taxable ? "Taxable" : "Exempt"}
                  </button>
                  <button
                    onClick={() => removeAdditionalLine(line.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-[#bbb] hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => addAdditionalLine("")}
                  className="text-xs px-3 py-1.5 rounded-lg border border-[#E5E3DE] text-[#666] hover:bg-[#F7F6F3] transition-colors flex items-center gap-1"
                >
                  <Plus size={11} />
                </button>
              </div>
            </div>
          </div>
          {/* Contact info */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#888] mb-3">
              Bill To
            </p>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Customer name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full text-sm border border-[#E5E3DE] rounded-xl px-3 py-2 focus:outline-none focus:border-[#111]"
              />
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="flex-1 text-sm border border-[#E5E3DE] rounded-xl px-3 py-2 focus:outline-none focus:border-[#111]"
                />
                <input
                  type="tel"
                  placeholder="Phone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="flex-1 text-sm border border-[#E5E3DE] rounded-xl px-3 py-2 focus:outline-none focus:border-[#111]"
                />
              </div>
              <textarea
                placeholder="Billing address"
                value={billToAddress}
                onChange={(e) => setBillToAddress(e.target.value)}
                rows={2}
                className="w-full text-sm border border-[#E5E3DE] rounded-xl px-3 py-2 focus:outline-none focus:border-[#111] resize-none"
              />
            </div>
          </div>

          {/* Ship To */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#888]">
                Ship To
              </p>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sameAsBilling}
                  onChange={(e) => setSameAsBilling(e.target.checked)}
                  className="rounded"
                />
                <span className="text-xs text-[#666]">Same as billing</span>
              </label>
            </div>
            {sameAsBilling ? (
              <div className="px-3 py-2 rounded-xl border border-[#E5E3DE] bg-[#FAFAF9] text-sm text-[#999] min-h-[60px] whitespace-pre-wrap">
                {billToAddress || (
                  <span className="italic">Fill in billing address above</span>
                )}
              </div>
            ) : (
              <textarea
                placeholder="Shipping address (used for tax calculation)"
                value={shipToAddress}
                onChange={(e) => setShipToAddress(e.target.value)}
                rows={2}
                className="w-full text-sm border border-[#E5E3DE] rounded-xl px-3 py-2 focus:outline-none focus:border-[#111] resize-none"
              />
            )}
          </div>

          {/* Terms & due date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-[#888] block mb-1.5">
                Billing Terms
              </label>
              <select
                value={billingTerms}
                onChange={(e) =>
                  setBillingTerms(
                    e.target.value as "NET30" | "PROGRESS" | "PREPAID" | "",
                  )
                }
                className="w-full text-sm border border-[#E5E3DE] rounded-xl px-3 py-2 focus:outline-none focus:border-[#111] bg-white"
              >
                <option value="">— None —</option>
                <option value="NET30">Net 30</option>
                <option value="PROGRESS">Progress Billing</option>
                <option value="PREPAID">Prepaid</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-[#888] block mb-1.5">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full text-sm border border-[#E5E3DE] rounded-xl px-3 py-2 focus:outline-none focus:border-[#111]"
              />
            </div>
          </div>
          {/* Notes */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-[#888] block mb-1.5">
              Notes
            </label>
            <textarea
              placeholder="Any notes for the customer..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full text-sm border border-[#E5E3DE] rounded-xl px-3 py-2 focus:outline-none focus:border-[#111] resize-none"
            />
          </div>
        </div>
        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#F0EEE9] flex items-center justify-between gap-4">
          <div className="text-sm">
            {previewAmount > 0 && (
              <span className="text-[#666]">
                Invoice total:{" "}
                <span className="font-semibold text-[#111]">
                  ${fmt(previewAmount)}
                </span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {error && <p className="text-xs text-red-600">{error}</p>}
            <button
              onClick={onClose}
              className="text-sm px-4 py-2 rounded-xl border border-[#E5E3DE] text-[#666] hover:bg-[#F7F6F3] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={saving}
              className="text-sm font-semibold px-5 py-2 rounded-xl bg-[#111] text-white hover:bg-[#333] disabled:opacity-40 transition-colors"
            >
              {saving ? "Creating…" : "Create Invoice"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
