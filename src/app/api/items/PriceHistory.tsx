import { prisma } from "@/lib/prisma";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

function fmt(v: number | null) {
  if (v == null) return <span className="text-[#ccc]">—</span>;
  return `$${v.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}

function Delta({ prev, curr }: { prev: number | null; curr: number | null }) {
  if (prev == null || curr == null) return null;
  const diff = curr - prev;
  if (diff === 0) return <Minus size={12} className="text-[#ccc]" />;
  const up = diff > 0;
  return (
    <span className={`flex items-center gap-0.5 text-[10px] font-semibold ${up ? "text-green-600" : "text-red-500"}`}>
      {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
      {up ? "+" : ""}${Math.abs(diff).toFixed(2)}
    </span>
  );
}

export async function PriceHistory({ itemId }: { itemId: string }) {
  const history = await prisma.itemPriceHistory.findMany({
    where: { itemId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  if (history.length === 0) {
    return (
      <div className="text-sm text-[#bbb] py-6 text-center">
        No price history yet
      </div>
    );
  }

  return (
    <div className="divide-y divide-[#F7F6F3]">
      {history.map((entry, i) => {
        const next = history[i + 1]; // older entry
        return (
          <div key={entry.id} className="flex items-center gap-4 px-5 py-3 hover:bg-[#FAFAF9] transition-colors">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#888]">
                  {new Date(entry.createdAt).toLocaleDateString(undefined, {
                    month: "short", day: "numeric", year: "numeric",
                  })}
                </span>
                <span className="text-[10px] text-[#ccc]">
                  {new Date(entry.createdAt).toLocaleTimeString(undefined, {
                    hour: "numeric", minute: "2-digit",
                  })}
                </span>
                {entry.changedBy && (
                  <span className="text-[10px] font-medium bg-[#F0EEE9] text-[#888] px-1.5 py-0.5 rounded">
                    {entry.changedBy}
                  </span>
                )}
              </div>
            </div>

            {/* Cost */}
            <div className="text-right w-28">
              <p className="text-[10px] text-[#aaa] uppercase tracking-wider mb-0.5">Cost</p>
              <div className="flex items-center justify-end gap-1.5">
                <Delta prev={next?.cost ?? null} curr={entry.cost} />
                <span className="text-sm text-[#666]">{fmt(entry.cost)}</span>
              </div>
            </div>

            {/* Price */}
            <div className="text-right w-28">
              <p className="text-[10px] text-[#aaa] uppercase tracking-wider mb-0.5">Price</p>
              <div className="flex items-center justify-end gap-1.5">
                <Delta prev={next?.price ?? null} curr={entry.price} />
                <span className="text-sm font-semibold text-[#111]">{fmt(entry.price)}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}