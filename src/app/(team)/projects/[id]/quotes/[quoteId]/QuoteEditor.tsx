"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Send,
  CheckCircle2,
  XCircle,
  Layers,
  Eye,
  EyeOff,
  Trash2,
  AlertCircle,
  FileText,
  Edit2,
  Check,
  Package,
} from "lucide-react";
import { QuoteWithDetails } from "@/types/quote";
import { QuoteStatus } from "@prisma/client";
import ConvertToSalesOrderButton from "@/app/components/team/sales-orders/ConvertToSalesOrderButton";
import CreatePOModal from "@/app/components/team/purchase-orders/CreatePOModal";
import CreateInvoiceModal from "@/app/components/team/invoices/CreateInvoiceModal";

// Derive types directly from the Prisma payload
type QuoteLine = QuoteWithDetails["lines"][number];
type Bundle = QuoteWithDetails["quoteBundles"][number];

const STATUS_CONFIG: Record<
  QuoteStatus,
  { label: string; color: string; icon: React.ReactNode }
> = {
  DRAFT: {
    label: "Draft",
    color: "bg-gray-100 text-gray-600",
    icon: <FileText size={13} />,
  },
  SENT: {
    label: "Sent",
    color: "bg-blue-100 text-blue-700",
    icon: <Send size={13} />,
  },
  ACCEPTED: {
    label: "Accepted",
    color: "bg-green-100 text-green-700",
    icon: <CheckCircle2 size={13} />,
  },
  REJECTED: {
    label: "Rejected",
    color: "bg-red-100 text-red-600",
    icon: <XCircle size={13} />,
  },
};

export default function QuoteEditor({
  quote: initialQuote,
  projectId,
}: {
  quote: QuoteWithDetails;
  projectId: string;
}) {
  const router = useRouter();
  const [lines, setLines] = useState<QuoteLine[]>(initialQuote.lines);
  const [bundles, setBundles] = useState<Bundle[]>(initialQuote.quoteBundles);
  const [status, setStatus] = useState<QuoteStatus>(initialQuote.status);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(true);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);
  const [newBundleName, setNewBundleName] = useState("");
  const [showBundleInput, setShowBundleInput] = useState(false);
  const [editingLineId, setEditingLineId] = useState<string | null>(null);
  const [showPOModal, setShowPOModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const pdfUrl = `/api/projects/${projectId}/quotes/${initialQuote.id}/pdf`;

  const [depositPct, setDepositPct] = useState<number | null>(
    initialQuote.depositPct ?? null,
  );
  const [depositAmount, setDepositAmount] = useState<number | null>(
    initialQuote.depositAmount ?? null,
  );
  const [depositPaid, setDepositPaid] = useState(
    initialQuote.depositPaid ?? false,
  );
  const [depositPaidAt, setDepositPaidAt] = useState<string>(
    initialQuote.depositPaidAt
      ? new Date(initialQuote.depositPaidAt).toISOString().split("T")[0]
      : "",
  );
  const [savingDeposit, setSavingDeposit] = useState(false);
  const [isDirect, setIsDirect] = useState(initialQuote.isDirect ?? false);
  const [isChangeOrder, setIsChangeOrder] = useState(initialQuote.isChangeOrder ?? false);
  const [scopeOfWork, setScopeOfWork] = useState(
    initialQuote.scopeOfWork ?? "",
  );
  const [termsAndConditions, setTermsAndConditions] = useState(
    initialQuote.termsAndConditions ?? "",
  );
  const [clientResponsibilities, setClientResponsibilities] = useState(
    initialQuote.clientResponsibilities ?? "",
  );
  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  // Unbundled lines
  const unbundledLines = lines.filter((l) => !l.bundleId);

  function updateLine(lineId: string, updates: Partial<QuoteLine>) {
    setLines((prev) =>
      prev.map((l) => (l.id === lineId ? { ...l, ...updates } : l)),
    );
    setSaved(false);
  }

  async function handleSaveDeposit() {
    setSavingDeposit(true);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/quotes/${initialQuote.id}/deposit`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            depositPct,
            depositAmount,
            depositPaid,
            depositPaidAt: depositPaidAt || null,
          }),
        },
      );
      if (!res.ok) throw new Error();
      showToast("success", "Deposit saved");
      router.refresh();
    } catch {
      showToast("error", "Failed to save deposit");
    } finally {
      setSavingDeposit(false);
    }
  }

  function removeLine(lineId: string) {
    setLines((prev) => prev.filter((l) => l.id !== lineId));
    setSaved(false);
  }

  function assignToBundle(lineId: string, bundleId: string | null) {
    setLines((prev) =>
      prev.map((l) => (l.id === lineId ? { ...l, bundleId } : l)),
    );
    setSaved(false);
  }

  function addBundle() {
    if (!newBundleName.trim()) return;
    const tempBundle = {
      id: `temp-${Date.now()}`,
      name: newBundleName.trim(),
      showToCustomer: true as const,
      lines: [] as Bundle["lines"],
      quoteId: initialQuote.id,
      createdAt: new Date(),
      bomId: null,
      salesOrderId: null,
    } satisfies Bundle;
    setBundles((prev) => [...prev, tempBundle]);
    setNewBundleName("");
    setShowBundleInput(false);
    setSaved(false);
  }

  console.log(
    "lines with bundleIds:",
    lines.map((l) => ({ id: l.id, bundleId: l.bundleId, desc: l.description })),
  );
  console.log(
    "bundles:",
    bundles.map((b) => ({ id: b.id, name: b.name })),
  );

  function toggleBundleVisibility(bundleId: string) {
    setBundles((prev) =>
      prev.map((b) =>
        b.id === bundleId ? { ...b, showToCustomer: !b.showToCustomer } : b,
      ),
    );
    setSaved(false);
  }

  function removeBundle(bundleId: string) {
    // Unassign lines from this bundle
    setLines((prev) =>
      prev.map((l) => (l.bundleId === bundleId ? { ...l, bundleId: null } : l)),
    );
    setBundles((prev) => prev.filter((b) => b.id !== bundleId));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    console.log("Saving lines: ", lines);
    console.log("Saving bundles: ", bundles);
    console.log("Saving status: ", status);
    console.log("Saving for quote it: ", initialQuote.id);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/quotes/${initialQuote.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lines,
            bundles,
            status,
            isDirect,
            isChangeOrder,
            scopeOfWork: scopeOfWork || null,
            termsAndConditions: termsAndConditions || null,
            clientResponsibilities: clientResponsibilities || null,
          }),
        },
      );
      if (!res.ok) throw new Error();
      setSaved(true);
      showToast("success", "Quote saved");
      router.refresh();
    } catch {
      showToast("error", "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(newStatus: QuoteStatus) {
    setStatus(newStatus);
    setSaved(false);
  }

  // Financials
  const subtotal = lines.reduce((s, l) => s + l.price * l.quantity, 0);
  const totalCost = lines.reduce((s, l) => s + (l.cost ?? 0) * l.quantity, 0);
  const margin = subtotal > 0 ? ((subtotal - totalCost) / subtotal) * 100 : 0;

  const statusCfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.DRAFT;

  const computedDeposit =
    depositAmount != null
      ? depositAmount
      : depositPct != null && subtotal > 0
        ? (depositPct / 100) * subtotal
        : null;

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

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-[#666] hover:text-[#111] mb-6 transition-colors"
        >
          <ArrowLeft size={15} />
          {initialQuote.project?.name ?? "Project"}
        </button>

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#999] mb-1">
              <span>{initialQuote.customer.name}</span>
              {initialQuote.boms.length > 0 && (
                <>
                  <span>·</span>
                  <span>
                    from BOM:{" "}
                    {initialQuote.boms.map((q) => q.bom.name).join(", ")}
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-[#111] tracking-tight font-mono">
                #{initialQuote.id.slice(0, 8).toUpperCase()}
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

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving || saved}
              className="text-sm font-semibold px-4 py-2 rounded-xl border border-[#E5E3DE] bg-white hover:bg-[#F7F6F3] disabled:opacity-40 transition-colors"
            >
              {saving ? "Saving…" : saved ? "Saved ✓" : "Save Changes"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Lines — left 2/3 */}
          <div className="col-span-2 space-y-4">
            {/* Unbundled lines */}
            <div className="bg-white border border-[#E5E3DE] rounded-2xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-[#F0EEE9] flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#888]">
                  Line Items
                </p>
                <p className="text-xs text-[#bbb]">
                  {unbundledLines.length} unbundled
                </p>
              </div>
              <p className="text-xs text-red-600  px-5 py-2 italic">
                Add items to bundles & click &apos;Save Changes&apos; before
                previewing quote.
              </p>

              {unbundledLines.length === 0 ? (
                <p className="text-sm text-[#bbb] px-5 py-8 text-center">
                  All lines are assigned to bundles
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
                    {unbundledLines.map((line) => (
                      <LineRow
                        key={line.id}
                        line={line}
                        bundles={bundles}
                        editing={editingLineId === line.id}
                        onEdit={() =>
                          setEditingLineId(
                            editingLineId === line.id ? null : line.id,
                          )
                        }
                        onUpdate={(u) => updateLine(line.id, u)}
                        onRemove={() => removeLine(line.id)}
                        onAssignBundle={(bId) => assignToBundle(line.id, bId)}
                      />
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Bundles */}
            {bundles.map((bundle) => {
              const bundleLines = lines.filter((l) => l.bundleId === bundle.id);
              const bundleTotal = bundleLines.reduce(
                (s, l) => s + l.price * l.quantity,
                0,
              );
              return (
                <div
                  key={bundle.id}
                  className="bg-white border border-[#E5E3DE] rounded-2xl overflow-hidden"
                >
                  <div className="px-5 py-3.5 border-b border-[#F0EEE9] flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Layers size={14} className="text-[#999]" />
                      <p className="text-sm font-semibold text-[#111]">
                        {bundle.name}
                      </p>
                      <span className="text-xs text-[#bbb]">
                        {bundleLines.length} item
                        {bundleLines.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[#111]">
                        $
                        {bundleTotal.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                      <button
                        onClick={() => toggleBundleVisibility(bundle.id)}
                        title={
                          bundle.showToCustomer
                            ? "Visible to customer"
                            : "Hidden from customer"
                        }
                        className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                          bundle.showToCustomer
                            ? "border-green-200 text-green-600 bg-green-50"
                            : "border-[#E5E3DE] text-[#999] bg-[#F7F6F3]"
                        }`}
                      >
                        {bundle.showToCustomer ? (
                          <Eye size={11} />
                        ) : (
                          <EyeOff size={11} />
                        )}
                        {bundle.showToCustomer ? "Visible" : "Hidden"}
                      </button>
                      <button
                        onClick={() => removeBundle(bundle.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-[#ccc] hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {bundleLines.length === 0 ? (
                    <p className="text-sm text-[#bbb] px-5 py-5 text-center italic">
                      No lines assigned — assign lines from the table above
                    </p>
                  ) : (
                    <table className="w-full">
                      <tbody>
                        {bundleLines.map((line) => (
                          <LineRow
                            key={line.id}
                            line={line}
                            bundles={bundles}
                            editing={editingLineId === line.id}
                            onEdit={() =>
                              setEditingLineId(
                                editingLineId === line.id ? null : line.id,
                              )
                            }
                            onUpdate={(u) => updateLine(line.id, u)}
                            onRemove={() => removeLine(line.id)}
                            onAssignBundle={(bId) =>
                              assignToBundle(line.id, bId)
                            }
                            inBundle
                          />
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              );
            })}

            {/* Add bundle */}
            {showBundleInput ? (
              <div className="bg-white border border-[#E5E3DE] rounded-2xl p-4 flex items-center gap-3">
                <Layers size={15} className="text-[#999] flex-shrink-0" />
                <input
                  type="text"
                  value={newBundleName}
                  onChange={(e) => setNewBundleName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addBundle()}
                  placeholder="Bundle name (e.g. Display Package)"
                  autoFocus
                  className="flex-1 text-sm text-[#111] placeholder:text-[#bbb] focus:outline-none"
                />
                <button
                  onClick={addBundle}
                  disabled={!newBundleName.trim()}
                  className="text-sm font-semibold bg-[#111] text-white px-4 py-1.5 rounded-lg disabled:opacity-40"
                >
                  Add
                </button>
                <button
                  onClick={() => setShowBundleInput(false)}
                  className="text-sm text-[#999] hover:text-[#111]"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowBundleInput(true)}
                className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-[#E5E3DE] rounded-2xl text-sm text-[#999] hover:text-[#111] hover:border-[#ccc] transition-colors"
              >
                <Layers size={14} />
                Add Bundle
              </button>
            )}

            {/* Proposal text sections */}
            {[
              {
                label: "Scope of Work",
                value: scopeOfWork,
                setter: setScopeOfWork,
              },
              {
                label: "Terms & Conditions",
                value: termsAndConditions,
                setter: setTermsAndConditions,
              },
              {
                label: "Client Responsibilities",
                value: clientResponsibilities,
                setter: setClientResponsibilities,
              },
            ].map(({ label, value, setter }) => (
              <div
                key={label}
                className="bg-white border border-[#E5E3DE] rounded-2xl overflow-hidden"
              >
                <div className="px-5 py-3.5 border-b border-[#F0EEE9]">
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#888]">
                    {label}
                  </p>
                </div>
                <textarea
                  value={value}
                  onChange={(e) => {
                    setter(e.target.value);
                    setSaved(false);
                  }}
                  placeholder={`Enter ${label.toLowerCase()}…`}
                  rows={5}
                  className="w-full px-5 py-4 text-sm text-[#111] placeholder:text-[#bbb] resize-y focus:outline-none"
                />
              </div>
            ))}
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
                    $
                    {subtotal.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#666]">Total Cost</span>
                  <span className="text-[#666]">
                    $
                    {totalCost.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="border-t border-[#F0EEE9] pt-3 flex justify-between text-sm">
                  <span className="text-[#666]">Margin</span>
                  <span
                    className={`font-bold text-base ${margin >= 20 ? "text-green-600" : margin >= 10 ? "text-amber-600" : "text-red-600"}`}
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
                    QuoteStatus,
                    (typeof STATUS_CONFIG)[QuoteStatus],
                  ][]
                ).map(([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => handleStatusChange(key)}
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
            {/* Quote Type */}
            <div className="bg-white border border-[#E5E3DE] rounded-2xl p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#888] mb-3">
                Quote Type
              </p>
              <div className="flex flex-col gap-1.5">
                {[
                  { label: "Proposal", active: !isDirect && !isChangeOrder, onClick: () => { setIsDirect(false); setIsChangeOrder(false); setSaved(false); } },
                  { label: "Direct Sale", active: isDirect && !isChangeOrder, onClick: () => { setIsDirect(true); setIsChangeOrder(false); setSaved(false); } },
                  { label: "Change Order", active: isChangeOrder, onClick: () => { setIsChangeOrder(true); setIsDirect(false); setSaved(false); } },
                ].map(({ label, active, onClick }) => (
                  <button
                    key={label}
                    onClick={onClick}
                    className={`w-full py-2 px-3 rounded-xl text-sm font-medium text-left transition-colors border ${active ? "bg-[#111] text-white border-[#111]" : "text-[#666] border-[#E5E3DE] hover:bg-[#F7F6F3]"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {isDirect && (
              <div className="bg-white border border-[#E5E3DE] rounded-2xl p-5">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#888] mb-3">
                  Direct Sale Details
                </p>
                {initialQuote.status === "ACCEPTED" ? (
                  <ConvertToSalesOrderButton
                    projectId={projectId}
                    quoteId={initialQuote.id}
                    existingSalesOrderId={initialQuote.salesOrder?.id}
                  />
                ) : (
                  <p className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-[#111] border border-[#E5E3DE] hover:bg-[#F7F6F3] transition-colors">
                    You can create a sales order once the quote is approved.
                  </p>
                )}{" "}
              </div>
            )}

            <button
              onClick={() => setShowPOModal(true)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-[#111] border border-[#E5E3DE] hover:bg-[#F7F6F3] transition-colors"
            >
              <Package size={14} />
              Create Purchase Order
            </button>

            <button
              onClick={() => setShowInvoiceModal(true)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-[#111] border border-[#E5E3DE] hover:bg-[#F7F6F3] transition-colors"
            >
              <Package size={14} />
              Create Customer Invoice
            </button>

            {showPOModal && (
              <CreatePOModal
                projectId={projectId}
                quoteId={initialQuote.id}
                lines={lines}
                onClose={() => setShowPOModal(false)}
              />
            )}

            {showInvoiceModal && (
              <CreateInvoiceModal
                projectId={projectId}
                quoteId={initialQuote.id}
                lines={lines}
                bundles={bundles}
                customer={initialQuote.customer}
                quoteSubtotal={subtotal}
                onClose={() => setShowInvoiceModal(false)}
              />
            )}

            {/* Actions */}
            <div className="bg-white border border-[#E5E3DE] rounded-2xl p-5 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#888] mb-4">
                Actions
              </p>
              <button
                onClick={() => setShowPDFPreview(true)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-[#111] border border-[#E5E3DE] hover:bg-[#F7F6F3] transition-colors"
              >
                <Eye size={14} />
                Preview PDF
              </button>
              <a
                href={`${pdfUrl}?download=true`}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-[#111] border border-[#E5E3DE] hover:bg-[#F7F6F3] transition-colors"
              >
                <FileText size={14} />
                Export PDF
              </a>
              <button className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-[#111] border border-[#E5E3DE] hover:bg-[#F7F6F3] transition-colors">
                <Send size={14} />
                Send to Customer
              </button>
            </div>

            {/* PDF Preview Modal */}
            {showPDFPreview && (
              <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div
                  className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                  onClick={() => setShowPDFPreview(false)}
                />
                <div className="relative bg-white rounded-2xl shadow-2xl border border-[#E5E3DE] w-[800px] h-[90vh] mx-4 flex flex-col overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#F0EEE9]">
                    <p className="text-sm font-semibold text-[#111]">
                      Quote #{initialQuote.id.slice(0, 8).toUpperCase()}
                    </p>
                    <div className="flex items-center gap-2">
                      <a
                        href={pdfUrl}
                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#111] text-white hover:bg-[#333] transition-colors"
                      >
                        <FileText size={12} />
                        Download
                      </a>
                      <button
                        onClick={() => setShowPDFPreview(false)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#F7F6F3] text-[#999] hover:text-[#111] transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  <iframe
                    src={`${pdfUrl}?preview=true`}
                    className="flex-1 w-full"
                    title="Quote PDF Preview"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Line Row Sub-component ───────────────────────────────────────────────────
function LineRow({
  line,
  bundles,
  editing,
  onEdit,
  onUpdate,
  onRemove,
  onAssignBundle,
  inBundle = false,
}: {
  line: QuoteLine;
  bundles: Bundle[];
  editing: boolean;
  onEdit: () => void;
  onUpdate: (u: Partial<QuoteLine>) => void;
  onRemove: () => void;
  onAssignBundle: (bundleId: string | null) => void;
  inBundle?: boolean;
}) {
  return (
    <>
      <tr
        className={`border-b border-[#F7F6F3] last:border-0 group ${inBundle ? "bg-[#FAFAF9]" : ""}`}
      >
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
            value={line.quantity}
            onChange={(e) =>
              onUpdate({ quantity: parseInt(e.target.value) || 0 })
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
              value={line.price}
              onChange={(e) =>
                onUpdate({ price: parseFloat(e.target.value) || 0 })
              }
              className="w-30 text-right text-sm border border-[#E5E3DE] rounded-lg px-2 py-1 focus:outline-none focus:border-[#111]"
            />
          </div>
        </td>
        <td className="px-5 py-3 text-right text-sm font-semibold text-[#111]">
          $
          {(line.price * line.quantity).toLocaleString(undefined, {
            minimumFractionDigits: 2,
          })}
        </td>
        <td className="pr-3">
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
            {/* Bundle assignment dropdown */}
            {bundles.length > 0 && (
              <select
                value={line.bundleId ?? ""}
                onChange={(e) => onAssignBundle(e.target.value || null)}
                className="text-xs border border-[#E5E3DE] rounded-lg px-2 py-1 text-[#666] focus:outline-none focus:border-[#111] max-w-[100px]"
              >
                <option value="">No bundle</option>
                {bundles.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            )}
            <button
              onClick={onRemove}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-[#ccc] hover:text-red-500 transition-colors"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </td>
      </tr>
    </>
  );
}
