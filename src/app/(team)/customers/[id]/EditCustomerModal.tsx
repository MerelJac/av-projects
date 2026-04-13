"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

type Customer = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  billingTerm: string | null;
  taxStatus: string;
};

export default function EditCustomerModal({
  customer,
  onClose,
}: {
  customer: Customer;
  onClose: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(customer.name);
  const [email, setEmail] = useState(customer.email ?? "");
  const [phone, setPhone] = useState(customer.phone ?? "");
  const [billingTerm, setBillingTerm] = useState(customer.billingTerm ?? "");
  const [taxStatus, setTaxStatus] = useState(customer.taxStatus ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!name.trim()) {
      setError("Customer name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/customers/${customer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim() || null,
          phone: phone.trim() || null,
          billingTerm: billingTerm || null,
          taxStatus: taxStatus || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      router.refresh();
      onClose();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0EEE9]">
          <h2 className="text-base font-semibold text-[#111]">Edit Customer</h2>
          <button
            onClick={onClose}
            className="text-[#999] hover:text-[#111] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#888] mb-1.5 uppercase tracking-wide">
              Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-[#E5E3DE] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#111]/10"
              placeholder="Customer name"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#888] mb-1.5 uppercase tracking-wide">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-[#E5E3DE] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#111]/10"
              placeholder="email@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#888] mb-1.5 uppercase tracking-wide">
              Phone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border border-[#E5E3DE] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#111]/10"
              placeholder="(555) 000-0000"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#888] mb-1.5 uppercase tracking-wide">
              Billing Terms
            </label>
            <select
              value={billingTerm}
              onChange={(e) => setBillingTerm(e.target.value)}
              className="w-full border border-[#E5E3DE] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#111]/10 bg-white"
            >
              <option value="">— None —</option>
              <option value="NET30">Net 30</option>
              <option value="PROGRESS">Progress Billing</option>
              <option value="PREPAID">Prepaid</option>
            </select>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}


        <div>
          <label className="block text-xs font-medium text-[#888] mb-1.5 uppercase tracking-wide">
            Tax Status
          </label>
          <select
            value={taxStatus}
            onChange={(e) => setTaxStatus(e.target.value)}
            className="w-full border border-[#E5E3DE] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#111]/10 bg-white"
          >
            <option value="TAXABLE">Taxable</option>
            <option value="EXEMPT">Tax Exempt</option>
          </select>
        </div>

                </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#F0EEE9]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-[#666] hover:text-[#111] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-semibold bg-[#111] text-white rounded-xl hover:bg-[#333] disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
