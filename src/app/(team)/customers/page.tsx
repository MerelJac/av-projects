import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, ArrowRight } from "lucide-react";

export default async function CustomersPage() {
  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { projects: true, quotes: true } },
    },
  });

  return (
    <div className="min-h-screen bg-[#F7F6F3]">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-[#111] tracking-tight">
            Customers
          </h1>
          <Link
            href="/customers/new"
            className="flex items-center gap-1.5 text-sm font-semibold bg-[#111] text-white px-4 py-2 rounded-xl hover:bg-[#333] transition-colors"
          >
            <Plus size={14} />
            New Customer
          </Link>
        </div>

        <div className="bg-white border border-[#E5E3DE] rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#F0EEE9]">
                <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-[#999] px-5 py-3">
                  Name
                </th>
                <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-[#999] px-3 py-3">
                  Email
                </th>
                <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-[#999] px-3 py-3">
                  Phone
                </th>
                <th className="text-right text-[10px] font-semibold uppercase tracking-widest text-[#999] px-3 py-3">
                  Projects
                </th>
                <th className="text-right text-[10px] font-semibold uppercase tracking-widest text-[#999] px-5 py-3">
                  Quotes
                </th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-sm text-[#bbb]"
                  >
                    No customers yet
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="border-b border-[#F7F6F3] last:border-0 hover:bg-[#FAFAF9] transition-colors group"
                  >
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/customers/${customer.id}`}
                        className="text-sm font-semibold text-[#111] hover:underline"
                      >
                        {customer.name}
                      </Link>
                      {customer.billingTerm && (
                        <p className="text-[10px] text-[#999] mt-0.5">
                          {customer.billingTerm}
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-3.5 text-sm text-[#666]">
                      {customer.email ? (
                        <a
                          href={`mailto:${customer.email}`}
                          className="hover:underline"
                        >
                          {customer.email}
                        </a>
                      ) : (
                        <span className="text-[#ccc]">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3.5 text-sm text-[#666]">
                      {customer.phone ?? <span className="text-[#ccc]">—</span>}
                    </td>
                    <td className="px-3 py-3.5 text-right text-sm text-[#666]">
                      {customer._count.projects > 0 ? (
                        customer._count.projects
                      ) : (
                        <span className="text-[#ccc]">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right text-sm text-[#666]">
                      {customer._count.quotes > 0 ? (
                        customer._count.quotes
                      ) : (
                        <span className="text-[#ccc]">—</span>
                      )}
                    </td>
                    <td className="pr-4">
                      <Link
                        href={`/customers/${customer.id}`}
                        className="text-sm font-semibold text-[#111] hover:underline"
                      >
                        <ArrowRight
                          size={14}
                          className="text-[#ccc] group-hover:text-[#111] transition-colors"
                        />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
