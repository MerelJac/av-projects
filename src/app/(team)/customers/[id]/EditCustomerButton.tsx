"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import EditCustomerModal from "./EditCustomerModal";

export type BillingTerms = "NET30" | "PROGRESS" | "PREPAID";

export type Customer = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  billingTerm: BillingTerms | null;
  taxStatus: string;
  address: string | null;
  address2: string | null;
  country: string | null;
  city: string | null;
  state: string | null;
  zipcode: string | null;
  billToAddress: string | null;
  billToAddress2: string | null;
  billToCountry: string | null;
  billToCity: string | null;
  billToState: string | null;
  billToZipcode: string | null;
};

export default function EditCustomerButton({
  customer,
}: {
  customer: Customer;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-sm font-semibold border border-[#E5E3DE] bg-white px-4 py-2 rounded-xl hover:bg-[#F7F6F3] transition-colors"
      >
        <Pencil size={13} />
        Edit
      </button>
      {open && (
        <EditCustomerModal customer={customer} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
