"use client";
import { useState } from "react";
import { CheckCircle2, AlertCircle, Pencil, X, Check } from "lucide-react";
import { buildAddress } from "@/lib/utils/helpers";

type User = {
  id: string;
  profile: { firstName: string; lastName: string } | null;
};

type VendorDefaults = {
  shipToContact: string | null;
  shipToAddress: string | null;
  shipToAddress2: string | null;
  shipToCity: string | null;
  shipToState: string | null;
  shipToZipcode: string | null;
  shipToCountry: string | null;
  billToContact: string | null;
  billToAddress: string | null;
  billToAddress2: string | null;
  billToCity: string | null;
  billToState: string | null;
  billToZipcode: string | null;
  billToCountry: string | null;
  shippingMethod: string | null;
  billingTerms:
    | "NET45"
    | "NET15"
    | "NET30"
    | "PROGRESS"
    | "PREPAID"
    | "DUE_UPON_RECEIPT"
    | null;
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
  const [toast, setToast] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  const [form, setForm] = useState({
    shipToContact: defaults.shipToContact ?? "",
    shipToAddress: defaults.shipToAddress ?? "",
    shipToAddress2: defaults.shipToAddress2 ?? "",
    shipToCity: defaults.shipToCity ?? "",
    shipToState: defaults.shipToState ?? "",
    shipToZipcode: defaults.shipToZipcode ?? "",
    shipToCountry: defaults.shipToCountry ?? "US",
    billToContact: defaults.billToContact ?? "",
    billToAddress: defaults.billToAddress ?? "",
    billToAddress2: defaults.billToAddress2 ?? "",
    billToCity: defaults.billToCity ?? "",
    billToState: defaults.billToState ?? "",
    billToZipcode: defaults.billToZipcode ?? "",
    billToCountry: defaults.billToCountry ?? "US",
    shippingMethod: defaults.shippingMethod ?? "",
    billingTerms: defaults.billingTerms ?? "",
    creditLimit:
      defaults.creditLimit != null ? String(defaults.creditLimit) : "",
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
          shipToContact: form.shipToContact || null,
          shipToAddress: form.shipToAddress || null,
          shipToAddress2: form.shipToAddress2 || null,
          shipToCity: form.shipToCity || null,
          shipToState: form.shipToState || null,
          shipToZipcode: form.shipToZipcode || null,
          shipToCountry: form.shipToCountry || null,
          billToContact: form.billToContact || null,
          billToAddress: form.billToAddress || null,
          billToAddress2: form.billToAddress2 || null,
          billToCity: form.billToCity || null,
          billToState: form.billToState || null,
          billToZipcode: form.billToZipcode || null,
          billToCountry: form.billToCountry || null,
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

  const inputCls =
    "w-full text-sm border border-[#E5E3DE] rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#111]";
  const labelCls =
    "block text-[10px] font-semibold uppercase tracking-widest text-[#999] mb-1.5";

  return (
    <div className="bg-white border border-[#E5E3DE] rounded-2xl overflow-hidden mb-6">
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

      <div className="px-6 py-5 space-y-5">
        {editing ? (
          <>
            {/* Shipping / Billing */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <div>
                <label className={labelCls}>Shipping Method</label>
                <input
                  className={inputCls}
                  value={form.shippingMethod}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, shippingMethod: e.target.value }))
                  }
                  placeholder="e.g. UPS Ground"
                />
              </div>
              <div>
                <label className={labelCls}>Billing Terms</label>
                <select
                  className={`${inputCls} bg-white`}
                  value={form.billingTerms}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, billingTerms: e.target.value }))
                  }
                >
                  <option value="">— None —</option>
                  <option value="NET15">Net 15</option>
                  <option value="NET30">Net 30</option>
                  <option value="DUE_UPON_RECEIPT">Due Upon Receipt</option>
                  <option value="NET45">Net 45</option>
                  <option value="PROGRESS">Progress Billing</option>
                  <option value="PREPAID">Prepaid</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Credit Limit</label>
                <input
                  type="number"
                  className={inputCls}
                  value={form.creditLimit}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, creditLimit: e.target.value }))
                  }
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className={labelCls}>Default Buyer</label>
                <select
                  className={`${inputCls} bg-white`}
                  value={form.defaultBuyerId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, defaultBuyerId: e.target.value }))
                  }
                >
                  <option value="">— None —</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.profile
                        ? `${u.profile.firstName} ${u.profile.lastName}`
                        : u.id}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Address blocks */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 border-t border-[#F0EEE9] pt-5">
              <AddressFields prefix="Ship-To" form={form} setForm={setForm} side="shipTo" inputCls={inputCls} labelCls={labelCls} />
              <AddressFields prefix="Bill-To" form={form} setForm={setForm} side="billTo" inputCls={inputCls} labelCls={labelCls} />
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <ReadField label="Shipping Method" value={form.shippingMethod || null} />
              <ReadField
                label="Billing Terms"
                value={
                  ({
                    NET15: "Net 15",
                    NET30: "Net 30",
                    DUE_UPON_RECEIPT: "Due Upon Receipt",
                    NET45: "Net 45",
                    PROGRESS: "Progress Billing",
                    PREPAID: "Prepaid",
                  } as Record<string, string>)[form.billingTerms] ?? null
                }
              />
              <ReadField
                label="Credit Limit"
                value={
                  form.creditLimit
                    ? `$${parseFloat(form.creditLimit).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                    : null
                }
              />
              <ReadField label="Default Buyer" value={buyerName(form.defaultBuyerId || null)} />
            </div>

            <div className="grid grid-cols-2 gap-x-8 border-t border-[#F0EEE9] pt-5">
              <ReadAddressBlock label="Ship-To" contact={form.shipToContact} address={buildAddress({ address1: form.shipToAddress, address2: form.shipToAddress2, city: form.shipToCity, state: form.shipToState, zipCode: form.shipToZipcode, country: form.shipToCountry })} />
              <ReadAddressBlock label="Bill-To" contact={form.billToContact} address={buildAddress({ address1: form.billToAddress, address2: form.billToAddress2, city: form.billToCity, state: form.billToState, zipCode: form.billToZipcode, country: form.billToCountry })} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

type FormState = {
  shipToContact: string; shipToAddress: string; shipToAddress2: string;
  shipToCity: string; shipToState: string; shipToZipcode: string; shipToCountry: string;
  billToContact: string; billToAddress: string; billToAddress2: string;
  billToCity: string; billToState: string; billToZipcode: string; billToCountry: string;
  shippingMethod: string; billingTerms: string; creditLimit: string; defaultBuyerId: string;
};

function AddressFields({
  prefix, form, setForm, side, inputCls, labelCls,
}: {
  prefix: string;
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  side: "shipTo" | "billTo";
  inputCls: string;
  labelCls: string;
}) {
  const f = (field: string) => `${side}${field[0].toUpperCase()}${field.slice(1)}` as keyof FormState;
  return (
    <div className="space-y-3">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#555]">{prefix}</p>
      <div>
        <label className={labelCls}>Contact</label>
        <input className={inputCls} value={form[f("contact")] as string} onChange={(e) => setForm((v) => ({ ...v, [f("contact")]: e.target.value }))} placeholder="Contact name" />
      </div>
      <div>
        <label className={labelCls}>Address</label>
        <input className={inputCls} value={form[f("address")] as string} onChange={(e) => setForm((v) => ({ ...v, [f("address")]: e.target.value }))} placeholder="123 Main St" />
      </div>
      <div>
        <label className={labelCls}>Address 2</label>
        <input className={inputCls} value={form[f("address2")] as string} onChange={(e) => setForm((v) => ({ ...v, [f("address2")]: e.target.value }))} placeholder="Suite 100" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-1">
          <label className={labelCls}>City</label>
          <input className={inputCls} value={form[f("city")] as string} onChange={(e) => setForm((v) => ({ ...v, [f("city")]: e.target.value }))} placeholder="City" />
        </div>
        <div>
          <label className={labelCls}>State</label>
          <input className={inputCls} value={form[f("state")] as string} onChange={(e) => setForm((v) => ({ ...v, [f("state")]: e.target.value }))} placeholder="CA" />
        </div>
        <div>
          <label className={labelCls}>Zip</label>
          <input className={inputCls} value={form[f("zipcode")] as string} onChange={(e) => setForm((v) => ({ ...v, [f("zipcode")]: e.target.value }))} placeholder="90210" />
        </div>
      </div>
      <div>
        <label className={labelCls}>Country</label>
        <input className={inputCls} value={form[f("country")] as string} onChange={(e) => setForm((v) => ({ ...v, [f("country")]: e.target.value }))} placeholder="US" />
      </div>
    </div>
  );
}

function ReadAddressBlock({ label, contact, address }: { label: string; contact: string; address: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#999] mb-1">{label}</p>
      {contact && <p className="text-sm font-medium text-[#111]">{contact}</p>}
      <p className="text-sm text-[#111] whitespace-pre-wrap">{address || "—"}</p>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[10px] font-semibold uppercase tracking-widest text-[#999] mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

function ReadField({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#999] mb-1">
        {label}
      </p>
      <p className="text-sm text-[#111]">{value ?? "—"}</p>
    </div>
  );
}
