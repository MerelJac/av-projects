"use client";
import { useState } from "react";
import { CheckCircle2, AlertCircle, Pencil, X, Check } from "lucide-react";

type User = { id: string; profile: { firstName: string; lastName: string } | null };

type VendorDefaults = {
  shipToAddress: string | null;
  billToAddress: string | null;
  shippingMethod: string | null;
  billingTerms: "NET30" | "PROGRESS" | "PREPAID" | null;
  creditLimit: number | null;
  defaultBuyerId: string | null;
};

export default function VendorDefaultsClient({
  vendorId,
  defaults,
  users,
}: {
  vendorId: string;
  defaults: VendorDefaults;
  users: User[];
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const [form, setForm] = useState({
    shipToAddress: defaults.shipToAddress ?? "",
    billToAddress: defaults.billToAddress ?? "",
    shippingMethod: defaults.shippingMethod ?? "",
    billingTerms: defaults.billingTerms ?? "",
    creditLimit: defaults.creditLimit != null ? String(defaults.creditLimit) : "",
    defaultBuyerId: defaults.defaultBuyerId ?? "",
  });

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/vendors/${vendorId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shipToAddress: form.shipToAddress || null,
          billToAddress: form.billToAddress || null,
          shippingMethod: form.shippingMethod || null,
          billingTerms: form.billingTerms || null,
          creditLimit: form.creditLimit ? parseFloat(form.creditLimit) : null,
          defaultBuyerId: form.defaultBuyerId || null,
        }),
      });
      if (!res.ok) throw new Error();
      setEditing(false);
      showToast("success", "Vendor defaults saved");
    } catch {
      showToast("error", "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  const buyerName = (id: string | null) => {
    if (!id) return "—";
    const u = users.find((u) => u.id === id);
    if (!u?.profile) return "—";
    return `${u.profile.firstName} ${u.profile.lastName}`;
  };

  return (
    <div className="bg-white border border-[#E5E3DE] rounded-2xl overflow-hidden mb-6">
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium shadow-lg border ${
          toast.type === "success" ? "bg-white border-green-200 text-green-700" : "bg-white border-red-200 text-red-600"
        }`}>
          {toast.type === "success" ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
          {toast.msg}
        </div>
      )}

      <div className="px-6 py-4 border-b border-[#F0EEE9] flex items-center justify-between">
        <h3 className="font-semibold text-sm text-[#111]">PO Defaults</h3>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 text-xs text-[#888] hover:text-[#111] transition-colors"
          >
            <Pencil size={12} /> Edit
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditing(false)}
              className="flex items-center gap-1 text-xs text-[#888] hover:text-[#111] transition-colors"
            >
              <X size={12} /> Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1 text-xs font-semibold bg-[#111] text-white px-3 py-1.5 rounded-lg hover:bg-[#333] disabled:opacity-40 transition-colors"
            >
              <Check size={12} /> {saving ? "Saving…" : "Save"}
            </button>
          </div>
        )}
      </div>

      <div className="px-6 py-5 grid grid-cols-2 gap-x-8 gap-y-4">
        {editing ? (
          <>
            <Field label="Ship-To Address">
              <textarea
                rows={3}
                className="w-full text-sm border border-[#E5E3DE] rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-[#111]"
                value={form.shipToAddress}
                onChange={(e) => setForm((f) => ({ ...f, shipToAddress: e.target.value }))}
              />
            </Field>
            <Field label="Bill-To Address">
              <textarea
                rows={3}
                className="w-full text-sm border border-[#E5E3DE] rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-[#111]"
                value={form.billToAddress}
                onChange={(e) => setForm((f) => ({ ...f, billToAddress: e.target.value }))}
              />
            </Field>
            <Field label="Shipping Method">
              <input
                className="w-full text-sm border border-[#E5E3DE] rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#111]"
                value={form.shippingMethod}
                onChange={(e) => setForm((f) => ({ ...f, shippingMethod: e.target.value }))}
                placeholder="e.g. UPS Ground"
              />
            </Field>
            <Field label="Billing Terms">
              <select
                className="w-full text-sm border border-[#E5E3DE] rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#111] bg-white"
                value={form.billingTerms}
                onChange={(e) => setForm((f) => ({ ...f, billingTerms: e.target.value }))}
              >
                <option value="">— None —</option>
                <option value="NET30">Net 30</option>
                <option value="PROGRESS">Progress Billing</option>
                <option value="PREPAID">Prepaid</option>
              </select>
            </Field>
            <Field label="Credit Limit">
              <input
                type="number"
                className="w-full text-sm border border-[#E5E3DE] rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#111]"
                value={form.creditLimit}
                onChange={(e) => setForm((f) => ({ ...f, creditLimit: e.target.value }))}
                placeholder="0.00"
              />
            </Field>
            <Field label="Default Buyer">
              <select
                className="w-full text-sm border border-[#E5E3DE] rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#111] bg-white"
                value={form.defaultBuyerId}
                onChange={(e) => setForm((f) => ({ ...f, defaultBuyerId: e.target.value }))}
              >
                <option value="">— None —</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.profile ? `${u.profile.firstName} ${u.profile.lastName}` : u.id}
                  </option>
                ))}
              </select>
            </Field>
          </>
        ) : (
          <>
            <ReadField label="Ship-To Address" value={form.shipToAddress || null} multiline />
            <ReadField label="Bill-To Address" value={form.billToAddress || null} multiline />
            <ReadField label="Shipping Method" value={form.shippingMethod || null} />
            <ReadField label="Billing Terms" value={{ NET30: "Net 30", PROGRESS: "Progress Billing", PREPAID: "Prepaid" }[form.billingTerms] ?? null} />
            <ReadField
              label="Credit Limit"
              value={form.creditLimit ? `$${parseFloat(form.creditLimit).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : null}
            />
            <ReadField label="Default Buyer" value={buyerName(form.defaultBuyerId || null)} />
          </>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-semibold uppercase tracking-widest text-[#999] mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function ReadField({ label, value, multiline }: { label: string; value: string | null; multiline?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#999] mb-1">{label}</p>
      <p className={`text-sm text-[#111] ${multiline ? "whitespace-pre-wrap" : ""}`}>{value ?? "—"}</p>
    </div>
  );
}
