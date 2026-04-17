"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  Ban,
  RefreshCw,
  DollarSign,
  Percent,
  List,
  ChevronRight,
  Trash2,
  Download,
  Pencil,
} from "lucide-react";
import NotesPanel from "@/app/components/NotesPanel";
import { buildAddress } from "@/lib/utils/helpers";

type InvoiceLine = {
  id: string;
  description: string;
  quantity: number;
  price: number;
  taxAmount: number | null;
  isBundleTotal: boolean;
};

type Invoice = {
  id: string;
  invoiceNumber: string | null;
  chargeType: "LINE_ITEMS" | "PERCENTAGE";
  chargePercent: number | null;
  amount: number | null;
  status: string;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  billToContact: string | null;
  billToAddress: string | null;
  billToAddress2: string | null;
  billToCity: string | null;
  billToState: string | null;
  billToZipcode: string | null;
  billToCountry: string | null;
  shipToContact: string | null;
  shipToAddress: string | null;
  shipToAddress2: string | null;
  shipToCity: string | null;
  shipToState: string | null;
  shipToZipcode: string | null;
  shipToCountry: string | null;
  billingTerms: "NET15" | "NET45" | "NET30" | "PROGRESS" | "PREPAID" |  "DUE_UPON_RECEIPT" | null;
  notes: string | null;
  issuedAt: Date | null;
  dueDate: Date | null;
  taxAmount: number | null;
  paidAt: Date | null;
  createdAt: Date;
  quote: { id: string } | null;
  lines: InvoiceLine[];
};

type Project = {
  id: string;
  name: string;
  customer: { name: string };
};

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  DRAFT: {
    label: "Draft",
    color: "bg-gray-100 text-gray-600",
    icon: <FileText size={12} />,
  },
  PENDING: {
    label: "Pending",
    color: "bg-amber-100 text-amber-700",
    icon: <Clock size={12} />,
  },
  SENT: {
    label: "Sent",
    color: "bg-blue-100 text-blue-700",
    icon: <Send size={12} />,
  },

  PAID: {
    label: "Paid",
    color: "bg-green-100 text-green-700",
    icon: <CheckCircle2 size={12} />,
  },
  REJECTED: {
    label: "Rejected",
    color: "bg-red-100 text-red-600",
    icon: <XCircle size={12} />,
  },
  REVISED: {
    label: "Revised",
    color: "bg-purple-100 text-purple-700",
    icon: <RefreshCw size={12} />,
  },
  VOID: {
    label: "Void",
    color: "bg-gray-100 text-gray-400",
    icon: <Ban size={12} />,
  },
};

const STATUS_ORDER = [
  "DRAFT",
  "SENT",
  "PENDING",
  "PAID",
  "REJECTED",
  "REVISED",
  "VOID",
] as const;

const fmt = (n: number) =>
  n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function formatDate(d: Date | null | string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function InvoicesEditor({
  project,
  invoices: initialInvoices,
  currentUserId,
}: {
  project: Project;
  invoices: Invoice[];
  currentUserId?: string;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recalculating, setRecalculating] = useState(false);
  const [recalculatingText, setRecalculatingText] = useState("Recalculate Tax");

  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialInvoices[0]?.id ?? null,
  );
  const [toast, setToast] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [editingInfo, setEditingInfo] = useState(false);
  const [savingInfo, setSavingInfo] = useState(false);
  const [infoForm, setInfoForm] = useState({
    issuedAt: "",
    dueDate: "",
    paidAt: "",
    billingTerms: "",
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    billToContact: "",
    billToAddress: "",
    billToAddress2: "",
    billToCity: "",
    billToState: "",
    billToZipcode: "",
    billToCountry: "",
    shipToContact: "",
    shipToAddress: "",
    shipToAddress2: "",
    shipToCity: "",
    shipToState: "",
    shipToZipcode: "",
    shipToCountry: "",
    notes: "",
  });

  function toDateInput(d: Date | null | string) {
    if (!d) return "";
    return new Date(d).toISOString().split("T")[0];
  }

  function startEditInfo() {
    if (!selected) return;
    setInfoForm({
      issuedAt: toDateInput(selected.issuedAt),
      dueDate: toDateInput(selected.dueDate),
      paidAt: toDateInput(selected.paidAt),
      billingTerms: selected.billingTerms ?? "",
      customerName: selected.customerName ?? "",
      customerEmail: selected.customerEmail ?? "",
      customerPhone: selected.customerPhone ?? "",
      billToContact: selected.billToContact ?? "",
      billToAddress: selected.billToAddress ?? "",
      billToAddress2: selected.billToAddress2 ?? "",
      billToCity: selected.billToCity ?? "",
      billToState: selected.billToState ?? "",
      billToZipcode: selected.billToZipcode ?? "",
      billToCountry: selected.billToCountry ?? "",
      shipToContact: selected.shipToContact ?? "",
      shipToAddress: selected.shipToAddress ?? "",
      shipToAddress2: selected.shipToAddress2 ?? "",
      shipToCity: selected.shipToCity ?? "",
      shipToState: selected.shipToState ?? "",
      shipToZipcode: selected.shipToZipcode ?? "",
      shipToCountry: selected.shipToCountry ?? "",
      notes: selected.notes ?? "",
    });
    setEditingInfo(true);
  }

  async function handleSaveInfo() {
    if (!selected) return;
    setSavingInfo(true);
    try {
      const res = await fetch(
        `/api/projects/${project.id}/invoices/${selected.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            issuedAt: infoForm.issuedAt || null,
            dueDate: infoForm.dueDate || null,
            paidAt: infoForm.paidAt || null,
            billingTerms: infoForm.billingTerms || null,
            customerName: infoForm.customerName || null,
            customerEmail: infoForm.customerEmail || null,
            customerPhone: infoForm.customerPhone || null,
            billToContact: infoForm.billToContact || null,
            billToAddress: infoForm.billToAddress || null,
            billToAddress2: infoForm.billToAddress2 || null,
            billToCity: infoForm.billToCity || null,
            billToState: infoForm.billToState || null,
            billToZipcode: infoForm.billToZipcode || null,
            billToCountry: infoForm.billToCountry || null,
            shipToContact: infoForm.shipToContact || null,
            shipToAddress: infoForm.shipToAddress || null,
            shipToAddress2: infoForm.shipToAddress2 || null,
            shipToCity: infoForm.shipToCity || null,
            shipToState: infoForm.shipToState || null,
            shipToZipcode: infoForm.shipToZipcode || null,
            shipToCountry: infoForm.shipToCountry || null,
            notes: infoForm.notes || null,
          }),
        },
      );
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setInvoices((prev) =>
        prev.map((i) => (i.id === selected.id ? { ...i, ...updated } : i)),
      );
      setEditingInfo(false);
      showToast("success", "Invoice updated");
    } catch {
      showToast("error", "Failed to save");
    } finally {
      setSavingInfo(false);
    }
  }

  async function handleRecalculateTax(invoiceId: string) {
    setRecalculating(true);
    setRecalculatingText("Recalculating...");

    const res = await fetch(
      `/api/projects/${project.id}/invoices/${invoiceId}/recalculate-tax`,
      { method: "POST" },
    );
    // console.log("calculate tax", res);
    if (res.ok) {
      const updated = await res.json();
      setInvoices((prev) =>
        prev.map((inv) => {
          if (inv.id !== invoiceId) return inv;
          console.log("tax lines", inv.lines);
          return {
            ...inv,
            taxAmount: updated.taxAmount,
            amount: updated.amount,
            lines: inv.lines.map((line) => {
              const lt = updated.lineTaxes?.find(
                (t: { invoiceLineId: string; taxAmount: number }) =>
                  t.invoiceLineId === line.id,
              );
              return lt != null ? { ...line, taxAmount: lt.taxAmount } : line;
            }),
          };
        }),
      );
      showToast("success", "Tax recalculated");
      setRecalculating(false);
      setRecalculatingText("Recalculate Tax");
    } else {
      const data = await res.json().catch(() => ({}));
      setRecalculating(false);
      showToast(
        "error",
        `Failed to recalculate tax${data.error ? ` — ${data.error}` : ""}`,
      );
    }
  }

  function handlePreviewPDF(invoiceId: string) {
    window.open(
      `/api/projects/${project.id}/invoices/${invoiceId}/pdf?preview=true`,
      "_blank",
    );
  }

  async function handleDeleteInvoice() {
    if (
      !confirm(
        `Are you sure you want to delete this invoice? This cannot be undone.`,
      )
    )
      return;

    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/projects/${project.id}/invoices/${selectedId}`,
        {
          method: "DELETE",
        },
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to delete");
      }
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to delete");
      setDeleting(false);
    }
  }

  const selected = invoices.find((i) => i.id === selectedId) ?? null;
  // console.log("ship to address", selected?.shipToAddress);

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleStatusChange(invoiceId: string, status: string) {
    setUpdatingStatus(invoiceId);
    try {
      const res = await fetch(
        `/api/projects/${project.id}/invoices/${invoiceId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        },
      );
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setInvoices((prev) =>
        prev.map((i) => (i.id === invoiceId ? { ...i, ...updated } : i)),
      );
      showToast("success", `Status updated to ${STATUS_CONFIG[status]?.label}`);
      router.refresh();
    } catch {
      showToast("error", "Failed to update status");
    } finally {
      setUpdatingStatus(null);
    }
  }

  const totalInvoiced = invoices
    .filter((i) => i.status !== "VOID")
    .reduce((s, i) => s + (i.amount ?? 0), 0);

  const totalPaid = invoices
    .filter((i) => i.status === "PAID")
    .reduce((s, i) => s + (i.amount ?? 0), 0);

  return (
    <div className="bg-[#F7F6F3] min-h-screen">
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
            <XCircle size={15} />
          )}
          {toast.msg}
        </div>
      )}

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-[#666] hover:text-[#111] mb-6 transition-colors"
        >
          <ArrowLeft size={15} />
          {project.name}
        </button>

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-xs text-[#999] mb-1">{project.customer.name}</p>
            <h1 className="text-2xl font-bold text-[#111] tracking-tight">
              Invoices
            </h1>
          </div>

          {/* Summary stats */}
          <div className="flex items-center gap-4 text-right">
            <div>
              <p className="text-xs text-[#999] uppercase tracking-widest">
                Invoiced
              </p>
              <p className="text-lg font-bold text-[#111]">
                ${fmt(totalInvoiced)}
              </p>
            </div>
            <div className="w-px h-10 bg-[#E5E3DE]" />
            <div>
              <p className="text-xs text-[#999] uppercase tracking-widest">
                Collected
              </p>
              <p className="text-lg font-bold text-green-600">
                ${fmt(totalPaid)}
              </p>
            </div>
          </div>
        </div>

        {invoices.length === 0 ? (
          <div className="bg-white border border-[#E5E3DE] rounded-2xl px-8 py-16 text-center">
            <DollarSign size={32} className="text-[#ddd] mx-auto mb-3" />
            <p className="text-sm font-semibold text-[#888]">No invoices yet</p>
            <p className="text-xs text-[#bbb] mt-1">
              Create invoices from a quote using the &quot;Create Invoice&quot;
              button.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-6 items-start">
            {/* Invoice list — left */}
            <div className="col-span-1 space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {invoices.map((inv) => {
                const cfg = STATUS_CONFIG[inv.status] ?? STATUS_CONFIG.DRAFT;
                const isSelected = inv.id === selectedId;
                return (
                  <button
                    key={inv.id}
                    onClick={() => setSelectedId(inv.id)}
                    className={`w-full text-left bg-white border rounded-2xl px-4 py-3.5 transition-all ${
                      isSelected
                        ? "border-[#111] shadow-sm"
                        : "border-[#E5E3DE] hover:border-[#ccc]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-mono font-semibold text-[#111] truncate">
                          {inv.invoiceNumber ?? inv.id.toUpperCase()}
                        </p>
                        <p className="text-xs text-[#999] mt-0.5">
                          {formatDate(inv.createdAt)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <span
                          className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}
                        >
                          {cfg.icon}
                          {cfg.label}
                        </span>
                        <p className="text-sm font-bold text-[#111]">
                          ${fmt(inv.amount ?? 0)}
                        </p>
                      </div>
                    </div>
                    {inv.customerName && (
                      <p className="text-xs text-[#999] mt-1.5 truncate">
                        {inv.customerName}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-[#bbb] flex items-center gap-1">
                        {inv.chargeType === "PERCENTAGE" ? (
                          <>
                            <Percent size={9} />
                            {inv.chargePercent}%
                          </>
                        ) : (
                          <>
                            <List size={9} />
                            {inv.lines.length} line
                            {inv.lines.length !== 1 ? "s" : ""}
                          </>
                        )}
                      </span>
                      <ChevronRight
                        size={12}
                        className={`text-[#ccc] transition-transform ${isSelected ? "rotate-90" : ""}`}
                      />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Detail panel — right */}
            {selected && (
              <div className="col-span-2 space-y-4">
                {/* Status picker */}
                <div className="bg-white border border-[#E5E3DE] rounded-2xl p-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#888] mb-3">
                    Status
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {STATUS_ORDER.map((key) => {
                      const cfg = STATUS_CONFIG[key];
                      const isActive = selected.status === key;
                      return (
                        <button
                          key={key}
                          onClick={() => handleStatusChange(selected.id, key)}
                          disabled={updatingStatus === selected.id}
                          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all disabled:opacity-50 ${
                            isActive
                              ? `${cfg.color} border-current`
                              : "text-[#666] border-[#E5E3DE] hover:bg-[#F7F6F3]"
                          }`}
                        >
                          {cfg.icon}
                          {cfg.label}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => handleDeleteInvoice()}
                      className="w-9 h-9 flex items-center justify-center rounded-xl border border-[#E5E3DE] bg-white hover:bg-red-50 hover:border-red-200 text-[#ccc] hover:text-red-500 transition-colors"
                      title="Delete invoice"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Invoice details */}
                <div className="bg-white border border-[#E5E3DE] rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-[#888]">
                        Invoice
                      </p>
                      <p className="text-lg font-bold font-mono text-[#111] mt-0.5">
                        {selected.invoiceNumber ?? selected.id.toUpperCase()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handlePreviewPDF(selected.id)}
                          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border border-[#E5E3DE] text-[#666] hover:bg-[#F7F6F3] transition-all"
                        >
                          <Download size={13} />
                          PDF
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-[#999]">Total</p>
                        <p className="text-2xl font-bold text-[#111]">
                          ${fmt(selected.amount ?? 0)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Info grid */}
                  <div className="border-t border-[#F0EEE9] pt-4 mb-5">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold uppercase tracking-widest text-[#888]">
                        Details
                      </p>
                      {!editingInfo ? (
                        <button
                          onClick={startEditInfo}
                          className="flex items-center gap-1 text-xs text-[#888] hover:text-[#111] transition-colors"
                        >
                          <Pencil size={11} /> Edit
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
                            className="text-xs font-semibold bg-[#111] text-white px-3 py-1 rounded-lg hover:bg-[#333] disabled:opacity-40 transition-colors"
                          >
                            {savingInfo ? "Saving…" : "Save"}
                          </button>
                        </div>
                      )}
                    </div>

                    {editingInfo ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { label: "Issued", key: "issuedAt" },
                            { label: "Due", key: "dueDate" },
                            { label: "Paid", key: "paidAt" },
                          ].map(({ label, key }) => (
                            <div key={key}>
                              <label className="text-[10px] font-semibold uppercase tracking-widest text-[#999] block mb-1">
                                {label}
                              </label>
                              <input
                                type="date"
                                value={infoForm[key as keyof typeof infoForm]}
                                onChange={(e) =>
                                  setInfoForm((f) => ({
                                    ...f,
                                    [key]: e.target.value,
                                  }))
                                }
                                className="w-full text-sm border border-[#E5E3DE] rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#111]"
                              />
                            </div>
                          ))}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-semibold uppercase tracking-widest text-[#999] block mb-1">
                              Billing Terms
                            </label>
                            <select
                              value={infoForm.billingTerms}
                              onChange={(e) =>
                                setInfoForm((f) => ({
                                  ...f,
                                  billingTerms: e.target.value,
                                }))
                              }
                              className="w-full text-sm border border-[#E5E3DE] rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:border-[#111]"
                            >
                              <option value="">— None —</option>
                              <option value="NET15">Net 15</option>
                              <option value="NET30">Net 30</option>
                              <option value="DUE_UPON_RECEIPT">
                                Due Upon Receipt
                              </option>
                              <option value="NET45">Net 45</option>
                              <option value="PROGRESS">Progress Billing</option>
                              <option value="PREPAID">Prepaid</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] font-semibold uppercase tracking-widest text-[#999] block mb-1">
                              Customer Name
                            </label>
                            <input
                              type="text"
                              value={infoForm.customerName}
                              onChange={(e) =>
                                setInfoForm((f) => ({
                                  ...f,
                                  customerName: e.target.value,
                                }))
                              }
                              className="w-full text-sm border border-[#E5E3DE] rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#111]"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-semibold uppercase tracking-widest text-[#999] block mb-1">
                              Email
                            </label>
                            <input
                              type="email"
                              value={infoForm.customerEmail}
                              onChange={(e) =>
                                setInfoForm((f) => ({
                                  ...f,
                                  customerEmail: e.target.value,
                                }))
                              }
                              className="w-full text-sm border border-[#E5E3DE] rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#111]"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-semibold uppercase tracking-widest text-[#999] block mb-1">
                              Phone
                            </label>
                            <input
                              type="tel"
                              value={infoForm.customerPhone}
                              onChange={(e) =>
                                setInfoForm((f) => ({
                                  ...f,
                                  customerPhone: e.target.value,
                                }))
                              }
                              className="w-full text-sm border border-[#E5E3DE] rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#111]"
                            />
                          </div>
                        </div>
                        {[
                          { label: "Bill To Address", prefix: "billTo" },
                          { label: "Ship To Address", prefix: "shipTo" },
                        ].map(({ label, prefix }) => (
                          <div key={prefix}>
                            <label className="text-[10px] font-semibold uppercase tracking-widest text-[#999] block mb-1">
                              {label}
                            </label>
                            <div className="space-y-1.5">
                                 <input
                                type="text"
                                placeholder="BillToContact"
                                value={
                                  infoForm[
                                    `${prefix}Contact` as keyof typeof infoForm
                                  ]
                                }
                                onChange={(e) =>
                                  setInfoForm((f) => ({
                                    ...f,
                                    [`${prefix}Contact`]: e.target.value,
                                  }))
                                }
                                className="w-full text-sm border border-[#E5E3DE] rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#111]"
                              />

                              <input
                                type="text"
                                placeholder="Address line 1"
                                value={
                                  infoForm[
                                    `${prefix}Address` as keyof typeof infoForm
                                  ]
                                }
                                onChange={(e) =>
                                  setInfoForm((f) => ({
                                    ...f,
                                    [`${prefix}Address`]: e.target.value,
                                  }))
                                }
                                className="w-full text-sm border border-[#E5E3DE] rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#111]"
                              />
                              <input
                                type="text"
                                placeholder="Address line 2"
                                value={
                                  infoForm[
                                    `${prefix}Address2` as keyof typeof infoForm
                                  ]
                                }
                                onChange={(e) =>
                                  setInfoForm((f) => ({
                                    ...f,
                                    [`${prefix}Address2`]: e.target.value,
                                  }))
                                }
                                className="w-full text-sm border border-[#E5E3DE] rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#111]"
                              />
                              <div className="flex gap-1.5">
                                <input
                                  type="text"
                                  placeholder="City"
                                  value={
                                    infoForm[
                                      `${prefix}City` as keyof typeof infoForm
                                    ]
                                  }
                                  onChange={(e) =>
                                    setInfoForm((f) => ({
                                      ...f,
                                      [`${prefix}City`]: e.target.value,
                                    }))
                                  }
                                  className="flex-1 text-sm border border-[#E5E3DE] rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#111]"
                                />
                                <input
                                  type="text"
                                  placeholder="ST"
                                  value={
                                    infoForm[
                                      `${prefix}State` as keyof typeof infoForm
                                    ]
                                  }
                                  onChange={(e) =>
                                    setInfoForm((f) => ({
                                      ...f,
                                      [`${prefix}State`]: e.target.value,
                                    }))
                                  }
                                  className="w-12 text-sm border border-[#E5E3DE] rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#111]"
                                />
                                <input
                                  type="text"
                                  placeholder="Zip"
                                  value={
                                    infoForm[
                                      `${prefix}Zipcode` as keyof typeof infoForm
                                    ]
                                  }
                                  onChange={(e) =>
                                    setInfoForm((f) => ({
                                      ...f,
                                      [`${prefix}Zipcode`]: e.target.value,
                                    }))
                                  }
                                  className="w-20 text-sm border border-[#E5E3DE] rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#111]"
                                />
                              </div>
                              <input
                                type="text"
                                placeholder="Country"
                                value={
                                  infoForm[
                                    `${prefix}Country` as keyof typeof infoForm
                                  ]
                                }
                                onChange={(e) =>
                                  setInfoForm((f) => ({
                                    ...f,
                                    [`${prefix}Country`]: e.target.value,
                                  }))
                                }
                                className="w-full text-sm border border-[#E5E3DE] rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#111]"
                              />
                            </div>
                          </div>
                        ))}
                        <div>
                          <label className="text-[10px] font-semibold uppercase tracking-widest text-[#999] block mb-1">
                            Notes
                          </label>
                          <textarea
                            rows={2}
                            value={infoForm.notes}
                            onChange={(e) =>
                              setInfoForm((f) => ({
                                ...f,
                                notes: e.target.value,
                              }))
                            }
                            className="w-full text-sm border border-[#E5E3DE] rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-[#111]"
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                          <div>
                            <p className="text-xs text-[#999] mb-0.5">Issued</p>
                            <p className="font-medium text-[#111]">
                              {formatDate(selected.issuedAt)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-[#999] mb-0.5">Due</p>
                            <p className="font-medium text-[#111]">
                              {formatDate(selected.dueDate)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-[#999] mb-0.5">Paid</p>
                            <p className="font-medium text-[#111]">
                              {formatDate(selected.paidAt)}
                            </p>
                          </div>
                          {selected.billingTerms && (
                            <div>
                              <p className="text-xs text-[#999] mb-0.5">
                                Terms
                              </p>
                              <p className="font-medium text-[#111]">
                                {
                                  {
                                    NET15: "Net 15",
                                    NET30: "Net 30",
                                    DUE_UPON_RECEIPT: "Due Upon Receipt",
                                    NET45: "Net 45",
                                    PROGRESS: "Progress Billing",
                                    PREPAID: "Prepaid",
                                  }[selected.billingTerms]
                                }
                              </p>
                            </div>
                          )}
                          {selected.chargeType === "PERCENTAGE" &&
                            selected.chargePercent && (
                              <div>
                                <p className="text-xs text-[#999] mb-0.5">
                                  Charge
                                </p>
                                <p className="font-medium text-[#111]">
                                  {selected.chargePercent}% progress billing
                                </p>
                              </div>
                            )}
                          {selected.quote && (
                            <div>
                              <p className="text-xs text-[#999] mb-0.5">
                                Quote
                              </p>
                              <p className="font-mono text-xs font-medium text-[#111]">
                                #{selected.quote.id.toUpperCase()}
                              </p>
                            </div>
                          )}
                        </div>
                        {(() => {
                          const billToStr = buildAddress({
                            address1: selected.billToAddress,
                            address2: selected.billToAddress2,
                            city: selected.billToCity,
                            state: selected.billToState,
                            zipCode: selected.billToZipcode,
                            country: selected.billToCountry,
                          });
                          const shipToStr = buildAddress({
                            address1: selected.shipToAddress,
                            address2: selected.shipToAddress2,
                            city: selected.shipToCity,
                            state: selected.shipToState,
                            zipCode: selected.shipToZipcode,
                            country: selected.shipToCountry,
                          });
                          if (
                            !selected.customerName &&
                            !billToStr &&
                            !shipToStr
                          )
                            return null;
                          return (
                            <div className="border-t border-[#F0EEE9] pt-4 grid grid-cols-2 gap-6">
                              {(selected.billToContact || billToStr) && (
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-widest text-[#999] mb-2">
                                    Bill To
                                  </p>
                                  {selected.billToContact && (
                                    <p className="text-sm font-semibold text-[#111]">
                                      {selected.billToContact}
                                    </p>
                                  )}
                                  {selected.customerEmail && (
                                    <p className="text-sm text-[#666]">
                                      {selected.customerEmail}
                                    </p>
                                  )}
                                  {selected.customerPhone && (
                                    <p className="text-sm text-[#666]">
                                      {selected.customerPhone}
                                    </p>
                                  )}
                                  {billToStr && (
                                    <p className="text-sm text-[#666] whitespace-pre-wrap mt-1">
                                      {billToStr}
                                    </p>
                                  )}
                                </div>
                              )}
                              {shipToStr && (
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-widest text-[#999] mb-2">
                                    Ship To
                                  </p>
                                  {selected.shipToContact && (
                                    <p className="text-sm font-semibold text-[#111]">
                                      {selected.shipToContact}
                                    </p>
                                  )}
                                  <p className="text-sm text-[#666] whitespace-pre-wrap">
                                    {shipToStr}
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </>
                    )}
                  </div>
                  {/* Line items */}
                  {selected.lines.length > 0 && (
                    <div className="border-t border-[#F0EEE9] pt-4">
                      <p className="text-xs font-semibold uppercase tracking-widest text-[#888] mb-3">
                        Line Items
                      </p>
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-[#F0EEE9]">
                            <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-[#999] pb-2">
                              Description
                            </th>
                            <th className="text-right text-[10px] font-semibold uppercase tracking-widest text-[#999] pb-2 w-12">
                              Qty
                            </th>
                            <th className="text-right text-[10px] font-semibold uppercase tracking-widest text-[#999] pb-2 w-24">
                              Price
                            </th>
                            <th className="text-right text-[10px] font-semibold uppercase tracking-widest text-[#999] pb-2 w-20">
                              Tax
                            </th>
                            <th className="text-right text-[10px] font-semibold uppercase tracking-widest text-[#999] pb-2 w-24">
                              Total
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {selected.lines.map((l) => (
                            <tr
                              key={l.id}
                              className="border-b border-[#F7F6F3] last:border-0"
                            >
                              <td className="py-2 text-sm text-[#111]">
                                {l.description}
                                {l.isBundleTotal && (
                                  <span className="ml-1.5 text-[10px] text-[#bbb] font-medium">
                                    bundle
                                  </span>
                                )}
                              </td>
                              <td className="py-2 text-sm text-[#666] text-right">
                                {l.quantity}
                              </td>
                              <td className="py-2 text-sm text-[#666] text-right">
                                ${fmt(l.price)}
                              </td>
                              <td className="py-2 text-sm text-[#666] text-right">
                                {l.taxAmount != null
                                  ? `$${fmt(l.taxAmount)}`
                                  : "—"}
                              </td>
                              <td className="py-2 text-sm font-semibold text-[#111] text-right">
                                ${fmt(l.price * l.quantity)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t border-[#E5E3DE]">
                            <td
                              colSpan={4}
                              className="pt-3 text-right text-xs text-[#999]"
                            >
                              Subtotal
                            </td>
                            <td className="pt-3 text-right text-sm text-[#111]">
                              $
                              {fmt(
                                selected.lines.reduce(
                                  (s, l) => s + l.price * l.quantity,
                                  0,
                                ),
                              )}
                            </td>
                          </tr>
                          {selected.taxAmount != null && (
                            <tr>
                              <td
                                colSpan={4}
                                className="text-right text-xs text-[#999]"
                              >
                                Tax
                              </td>
                              <td className="text-right text-sm text-[#111]">
                                ${fmt(selected.taxAmount)}
                              </td>
                            </tr>
                          )}
                          <tr>
                            <td
                              colSpan={4}
                              className="text-right text-xs font-semibold text-[#111] pt-1"
                            >
                              Total
                            </td>
                            <td className="text-right text-sm font-bold text-[#111] pt-1">
                              ${fmt(selected.amount ?? 0)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                      <button
                        onClick={() => handleRecalculateTax(selected.id)}
                        disabled={recalculating}
                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border border-[#E5E3DE] text-[#666] hover:bg-[#F7F6F3] transition-all"
                      >
                        <RefreshCw size={13} />
                        {recalculatingText}
                      </button>
                    </div>
                  )}

                  {/* Invoice notes (from creation) */}
                  {selected.notes && (
                    <div className="border-t border-[#F0EEE9] pt-4 mt-4">
                      <p className="text-xs text-[#999] mb-1">Notes</p>
                      <p className="text-sm text-[#666] whitespace-pre-wrap">
                        {selected.notes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Internal notes */}
                <NotesPanel
                  documentType="INVOICE"
                  documentId={selected.id}
                  currentUserId={currentUserId}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
