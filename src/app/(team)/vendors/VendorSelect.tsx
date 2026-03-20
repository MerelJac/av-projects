"use client";
// app/components/vendors/VendorSelect.tsx
// Drop this anywhere you need a vendor picker (e.g. CreatePurchaseOrderModal)

import { useEffect, useState } from "react";

type Vendor = { id: string; name: string };

export function VendorSelect({
  value,
  onChange,
  required,
}: {
  value: string;
  onChange: (id: string) => void;
  required?: boolean;
}) {
  const [vendors, setVendors] = useState<Vendor[]>([]);

  useEffect(() => {
    fetch("/api/vendors")
      .then((r) => r.json())
      .then(setVendors);
  }, []);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      className="w-full border border-[#E5E3DE] rounded-xl px-3 py-2 text-sm outline-none focus:border-[#111] bg-white"
    >
      <option value="">Select vendor…</option>
      {vendors.map((v) => (
        <option key={v.id} value={v.id}>
          {v.name}
        </option>
      ))}
    </select>
  );
}