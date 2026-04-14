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
  address: string | null;
  address2: string | null;
  country: string | null;
  city: string | null;
  state: string | null;
  zipcode: number | null;
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
  const [address, setAddress] = useState(customer.address ?? "");
  const [address2, setAddress2] = useState(customer.address2 ?? "");
  const [country, setCountry] = useState(customer.country ?? "");
  const [city, setCity] = useState(customer.city ?? "");
  const [state, setState] = useState(customer.state ?? "");
  const [zipcode, setZipcode] = useState(customer.zipcode ?? "");
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
          address: address || null,
          address2: address2 || null,
          country: country || null,
          city: city || null,
          state: state || null,
          zipcode: zipcode || null,
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

        <div className="px-6 py-5 space-y-4 overflow-y-scroll max-h-[80vh]">
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
              Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full border border-[#E5E3DE] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#111]/10"
              placeholder="123 Main St"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#888] mb-1.5 uppercase tracking-wide">
              Address 2
            </label>
            <input
              type="text"
              value={address2}
              onChange={(e) => setAddress2(e.target.value)}
              className="w-full border border-[#E5E3DE] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#111]/10"
              placeholder="Apt, suite, unit, etc."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#888] mb-1.5 uppercase tracking-wide">
                City
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full border border-[#E5E3DE] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#111]/10"
                placeholder="New York"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#888] mb-1.5 uppercase tracking-wide">
                State
              </label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full border border-[#E5E3DE] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#111]/10"
                placeholder="NY"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#888] mb-1.5 uppercase tracking-wide">
                Zip Code
              </label>
              <input
                type="text"
                value={zipcode}
                onChange={(e) => setZipcode(e.target.value)}
                className="w-full border border-[#E5E3DE] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#111]/10"
                placeholder="10001"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#888] mb-1.5 uppercase tracking-wide">
                Country
              </label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full border border-[#E5E3DE] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#111]/10"
                placeholder="US"
              />
            </div>
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
