import { prisma } from "@/lib/prisma";
import Link from "next/link";

const statusStyles: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  SENT: "bg-blue-100 text-blue-700",
  ACCEPTED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-600",
};

export default async function QuotesPage() {
  const quotes = await prisma.quote.findMany({
    include: {
      customer: true,
      project: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-[#111] tracking-tight">Quotes</h1>
      </div>

      <div className="bg-white border border-[#E5E3DE] rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#F0EEE9]">
              <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-[#999] px-5 py-3">
                Quote
              </th>
              <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-[#999] px-3 py-3">
                Customer
              </th>
              <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-[#999] px-3 py-3">
                Project
              </th>
              <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-[#999] px-3 py-3">
                Status
              </th>
              <th className="text-right text-[10px] font-semibold uppercase tracking-widest text-[#999] px-5 py-3">
                Total
              </th>
              <th className="text-right text-[10px] font-semibold uppercase tracking-widest text-[#999] px-5 py-3">
                Date
              </th>
            </tr>
          </thead>
          <tbody>
            {quotes.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-sm text-[#bbb]">
                  No quotes yet
                </td>
              </tr>
            ) : (
              quotes.map((q) => (
                <tr key={q.id} className="border-b border-[#F7F6F3] last:border-0 hover:bg-[#FAFAF9] transition-colors">
                  <td className="px-5 py-3">
                    <Link
                      href={q.projectId ? `/projects/${q.projectId}/quotes/${q.id}` : `/quotes/${q.id}`}
                      className="text-xs font-mono font-semibold text-[#111] hover:underline"
                    >
                      #{q.id.toUpperCase()}
                    </Link>
                  </td>
                  <td className="px-3 py-3 text-sm text-[#111]">
                    {q.customer.name}
                  </td>
                  <td className="px-3 py-3 text-sm text-[#666]">
                    {q.project?.name ?? <span className="text-[#bbb]">—</span>}
                  </td>
                  <td className="px-3 py-3">
                    <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${statusStyles[q.status]}`}>
                      {q.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right text-sm font-semibold text-[#111]">
                    {q.total != null
                      ? `$${q.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                      : <span className="text-[#bbb] font-normal">—</span>
                    }
                  </td>
                  <td className="px-5 py-3 text-right text-xs text-[#999]">
                    {new Date(q.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}