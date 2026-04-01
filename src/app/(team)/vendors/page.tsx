// app/vendors/page.tsx
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Building2, Plus } from "lucide-react";
import { AddVendorButton } from "./AddVendorButton";
import { getVendorLocalBalances } from "@/lib/bc-local";

export default async function VendorsPage() {
  const [vendors, localBalanceMap] = await Promise.all([
    prisma.vendor.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { purchaseOrders: true } } },
    }),
    getVendorLocalBalances(),
  ]);

  return (
    <div className="min-h-screen bg-[#F7F6F3]">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#111] tracking-tight">Vendors</h1>
            <p className="text-sm text-[#999] mt-1">{vendors.length} total</p>
          </div>
          <AddVendorButton />
        </div>

        <div className="bg-white border border-[#E5E3DE] rounded-2xl overflow-hidden">
          {vendors.length === 0 ? (
            <p className="px-5 py-12 text-sm text-[#bbb] text-center">No vendors yet</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#F0EEE9]">
                  {["Name",  "Antares Balance", "POs", ""].map((h) => (
                    <th
                      key={h}
                      className="text-left text-[10px] font-semibold uppercase tracking-widest text-[#999] px-5 py-3"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vendors.map((v) => (
                  <tr
                    key={v.id}
                    className="border-b border-[#F7F6F3] last:border-0 hover:bg-[#FAFAF9] transition-colors"
                  >
                    <td className="px-5 py-3.5 text-sm font-medium text-[#111]">{v.name}</td>
                    <td className="px-5 py-3.5 text-sm text-[#666]">
                      {localBalanceMap.has(v.id)
                        ? `$${localBalanceMap.get(v.id)!.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : "—"}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-[#666]">
                      {v._count.purchaseOrders}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/vendors/${v.id}`}
                        className="text-xs text-[#999] hover:text-[#111] transition"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}