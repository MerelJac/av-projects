import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { PriceHistory } from "@/app/api/items/PriceHistory";

const typeStyles: Record<string, string> = {
  HARDWARE: "bg-blue-50 text-blue-700",
  SOFTWARE: "bg-purple-50 text-purple-700",
  SUBSCRIPTION: "bg-amber-50 text-amber-700",
  SERVICE: "bg-green-50 text-green-700",
};

export default async function ItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const item = await prisma.item.findUnique({
    where: { id },
    include: {
      customerPrices: {
        include: { customer: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!item) return notFound();

  const margin =
    item.cost && item.price
      ? (((item.price - item.cost) / item.price) * 100).toFixed(1)
      : null;

  return (
    <div className="min-h-screen bg-[#F7F6F3]">
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-6">
        <Link
          href="/items"
          className="flex items-center gap-2 text-sm text-[#666] hover:text-[#111] transition-colors"
        >
          <ArrowLeft size={15} />
          Items
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${typeStyles[item.type] ?? "bg-gray-100 text-gray-600"}`}
              >
                {item.type}
              </span>
              {!item.active && (
                <span className="text-[10px] font-semibold px-2 py-0.5 bg-red-50 text-red-500 rounded-full">
                  Inactive
                </span>
              )}
              {item.eolDate && (
                <span className="text-[10px] font-semibold px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full">
                  EOL {new Date(item.eolDate).toLocaleDateString()}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-[#111] tracking-tight font-mono">
              {item.itemNumber}
            </h1>
            {item.manufacturer && (
              <p className="text-sm text-[#666] mt-1">{item.manufacturer}</p>
            )}
            {item.description && (
              <p className="text-sm text-[#888] mt-2 max-w-lg">{item.description}</p>
            )}
          </div>
          <Link
            href={`/items/${item.id}/edit`}
            className="text-sm font-semibold px-4 py-2 rounded-xl border border-[#E5E3DE] bg-white hover:bg-[#F7F6F3] transition-colors"
          >
            Edit Item
          </Link>
        </div>

        {/* Pricing */}
        <div className="bg-white border border-[#E5E3DE] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#F0EEE9]">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#888]">
              Pricing
            </p>
          </div>
          <div className="grid grid-cols-4 divide-x divide-[#F0EEE9]">
            {[
              { label: "Cost", value: item.cost },
              { label: "List Price", value: item.price },
              { label: "Last Sold", value: item.lastSoldPrice },
            ].map(({ label, value }) => (
              <div key={label} className="px-6 py-5">
                <p className="text-xs text-[#999] mb-1">{label}</p>
                <p className="text-xl font-bold text-[#111]">
                  {value != null ? (
                    `$${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                  ) : (
                    <span className="text-[#ccc] font-normal text-base">—</span>
                  )}
                </p>
              </div>
            ))}
            <div className="px-6 py-5">
              <p className="text-xs text-[#999] mb-1">Margin</p>
              <p
                className={`text-xl font-bold ${
                  margin == null
                    ? "text-[#ccc]"
                    : parseFloat(margin) >= 20
                      ? "text-green-600"
                      : parseFloat(margin) >= 10
                        ? "text-amber-600"
                        : "text-red-600"
                }`}
              >
                {margin != null ? (
                  `${margin}%`
                ) : (
                  <span className="font-normal text-base">—</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="bg-white border border-[#E5E3DE] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#F0EEE9]">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#888]">
              Details
            </p>
          </div>
          <div className="grid grid-cols-4 divide-x divide-[#F0EEE9]">
            <div className="px-6 py-5">
              <p className="text-xs text-[#999] mb-1">Category</p>
              <p className="text-sm font-medium text-[#111]">
                {item.category ?? <span className="text-[#ccc]">—</span>}
              </p>
            </div>
            <div className="px-6 py-5">
              <p className="text-xs text-[#999] mb-1">Approved</p>
              <div className="flex items-center gap-1.5">
                {item.approved ? (
                  <>
                    <CheckCircle2 size={14} className="text-green-500" />
                    <span className="text-sm font-medium text-green-600">
                      Approved
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle size={14} className="text-[#ccc]" />
                    <span className="text-sm text-[#999]">Not approved</span>
                  </>
                )}
              </div>
            </div>
            <div className="px-6 py-5">
              <p className="text-xs text-[#999] mb-1">Added</p>
              <p className="text-sm font-medium text-[#111]">
                {new Date(item.createdAt).toLocaleDateString()}
              </p>
            </div>

                        <div className="px-6 py-5">
              <p className="text-xs text-[#999] mb-1">Unit</p>
              <p className="text-sm font-medium text-[#111]">
                {item.unit ?? <span className="text-[#ccc]">—</span>}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#E5E3DE] rounded-2xl overflow-hidden mt-6">
          <div className="px-5 py-4 border-b border-[#F0EEE9]">
            <h2 className="text-sm font-semibold text-[#111]">Price History</h2>
          </div>
          <PriceHistory itemId={item.id} />
        </div>

        {/* Customer Pricing */}
        <div className="bg-white border border-[#E5E3DE] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#F0EEE9] flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#888]">
              Customer Pricing
            </p>
            <span className="text-xs text-[#bbb]">
              {item.customerPrices.length}
            </span>
          </div>
          {item.customerPrices.length === 0 ? (
            <p className="px-6 py-10 text-sm text-[#bbb] text-center">
              No custom pricing set — list price applies to all customers
            </p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#F0EEE9]">
                  <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-[#999] px-6 py-3">
                    Customer
                  </th>
                  <th className="text-right text-[10px] font-semibold uppercase tracking-widest text-[#999] px-3 py-3">
                    Price
                  </th>
                  <th className="text-right text-[10px] font-semibold uppercase tracking-widest text-[#999] px-6 py-3">
                    vs List
                  </th>
                  <th className="text-right text-[10px] font-semibold uppercase tracking-widest text-[#999] px-6 py-3">
                    Since
                  </th>
                </tr>
              </thead>
              <tbody>
                {item.customerPrices.map((p) => {
                  const diff = item.price
                    ? ((p.price - item.price) / item.price) * 100
                    : null;
                  return (
                    <tr
                      key={p.id}
                      className="border-b border-[#F7F6F3] last:border-0 hover:bg-[#FAFAF9] transition-colors"
                    >
                      <td className="px-6 py-3.5">
                        <Link
                          href={`/customers/${p.customerId}`}
                          className="text-sm font-medium text-[#111] hover:underline"
                        >
                          {p.customer.name}
                        </Link>
                      </td>
                      <td className="px-3 py-3.5 text-right text-sm font-semibold text-[#111]">
                        $
                        {p.price.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-6 py-3.5 text-right text-sm">
                        {diff != null ? (
                          <span
                            className={
                              diff < 0
                                ? "text-red-500"
                                : diff > 0
                                  ? "text-green-600"
                                  : "text-[#999]"
                            }
                          >
                            {diff > 0 ? "+" : ""}
                            {diff.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-[#ccc]">—</span>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-right text-xs text-[#999]">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
