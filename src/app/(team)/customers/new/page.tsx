import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createCustomer } from "../actions";

const inputCls =
  "w-full text-sm text-[#111] border border-[#E5E3DE] rounded-xl px-3 py-2.5 placeholder:text-[#ccc] focus:outline-none focus:border-[#111] transition-colors bg-white";
const labelCls =
  "block text-[10px] font-semibold uppercase tracking-widest text-[#999] mb-1.5";

export default function NewCustomerPage() {
  return (
    <div className="bg-[#F7F6F3] min-h-screen">
      <div className="max-w-lg mx-auto px-6 pt-10 pb-16">
        <Link
          href="/customers"
          className="flex items-center gap-2 text-sm text-[#999] hover:text-[#111] mb-8 transition-colors w-fit"
        >
          <ArrowLeft size={15} />
          Customers
        </Link>

        <h1 className="text-2xl font-bold text-[#111] tracking-tight mb-8">
          New Customer
        </h1>

        <div className="bg-white border border-[#E5E3DE] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#F0EEE9]">
            <h2 className="text-sm font-semibold text-[#111]">Details</h2>
          </div>

          <form action={createCustomer} className="px-6 py-6 space-y-5">
            <div>
              <label className={labelCls}>Customer Name</label>
              <input
                name="name"
                placeholder="Acme Corp"
                className={inputCls}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Email</label>
                <input
                  name="email"
                  type="email"
                  placeholder="billing@acme.com"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Phone</label>
                <input
                  name="phone"
                  placeholder="+1 555 000 0000"
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>Billing Terms</label>
              <select name="billingTerms" defaultValue="NET30" className={inputCls}>
                <option value="NET15">Net 15</option>
                <option value="NET30">Net 30</option>
                <option value="DUE_UPON_RECEIPT">Due Upon Receipt</option>
                <option value="NET45">Net 45</option>
                <option value="PROGRESS">Progress Billing</option>
                <option value="PREPAID">Prepaid</option>
              </select>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full text-sm font-semibold bg-[#111] text-white px-4 py-2.5 rounded-xl hover:bg-[#333] transition-colors"
              >
                Create Customer
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
