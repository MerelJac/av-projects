import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, ArrowRight, Upload } from "lucide-react";

const typeStyles: Record<string, string> = {
  HARDWARE: "bg-blue-50 text-blue-700",
  SOFTWARE: "bg-purple-50 text-purple-700",
  SUBSCRIPTION: "bg-amber-50 text-amber-700",
  SERVICE: "bg-green-50 text-green-700",
};

export default async function ItemsPage() {
  const items = await prisma.item.findMany({
    orderBy: { itemNumber: "asc" },
  });

  return (
    <div className="min-h-screen bg-[#F7F6F3]">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-[#111] tracking-tight">
            Items
          </h1>
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/items/new"
              className="flex items-center gap-1.5 text-sm font-semibold bg-[#111] text-white px-4 py-2 rounded-xl hover:bg-[#333] transition-colors"
            >
              <Plus size={14} />
              Add Item
            </Link>
            <Link
              href="/items/import"
              className="flex items-center gap-1.5 text-sm font-medium text-[#666] hover:text-[#111] px-3 py-2 rounded-xl hover:bg-white transition-colors border border-[#E5E3DE]"
            >
              <Upload size={14} />
              Import CSV
            </Link>
          </div>
        </div>

        <div className="bg-white border border-[#E5E3DE] rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#F0EEE9]">
                <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-[#999] px-5 py-3">
                  Item #
                </th>
                <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-[#999] px-3 py-3">
                  Manufacturer
                </th>
                <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-[#999] px-3 py-3">
                  Type
                </th>
                <th className="text-right text-[10px] font-semibold uppercase tracking-widest text-[#999] px-3 py-3">
                  Cost
                </th>
                <th className="text-right text-[10px] font-semibold uppercase tracking-widest text-[#999] px-5 py-3">
                  Price
                </th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-sm text-[#bbb]"
                  >
                    No items yet
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-[#F7F6F3] last:border-0 hover:bg-[#FAFAF9] transition-colors group"
                  >
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/items/${item.id}`}
                        className="text-sm font-mono font-semibold text-[#111] hover:underline"
                      >
                        {item.itemNumber}
                      </Link>
                      {!item.active && (
                        <span className="ml-2 text-[10px] font-semibold px-1.5 py-0.5 bg-red-50 text-red-500 rounded">
                          EOL
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3.5 text-sm text-[#666]">
                      {item.manufacturer ?? (
                        <span className="text-[#ccc]">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3.5">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${typeStyles[item.type] ?? "bg-gray-100 text-gray-600"}`}
                      >
                        {item.type}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 text-right text-sm text-[#999]">
                      {item.cost != null ? (
                        `$${item.cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                      ) : (
                        <span className="text-[#ccc]">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right text-sm font-semibold text-[#111]">
                      {item.price != null ? (
                        `$${item.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                      ) : (
                        <span className="text-[#ccc] font-normal">—</span>
                      )}
                    </td>
                    <td className="pr-4">
                      <Link
                        href={`/items/${item.id}`}
                        className="text-sm font-mono font-semibold text-[#111] hover:underline"
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
