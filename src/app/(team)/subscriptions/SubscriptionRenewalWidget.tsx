import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { RefreshCw, AlertTriangle } from "lucide-react";

function daysUntil(date: Date) {
  return Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export async function SubscriptionRenewalWidget() {
  const upcoming = await prisma.subscription.findMany({
    where: {
      status: { in: ["ACTIVE", "PENDING_RENEWAL"] },
      endDate: {
        lte: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // next 60 days
      },
    },
    include: {
      item: { select: { itemNumber: true, manufacturer: true, price: true } },
      customer: { select: { id: true, name: true } },
    },
    orderBy: { endDate: "asc" },
    take: 8,
  });

  const expired = await prisma.subscription.count({ where: { status: "EXPIRED" } });

  if (upcoming.length === 0 && expired === 0) return null;

  return (
    <div className="bg-white border border-[#E5E3DE] rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-[#F0EEE9] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RefreshCw size={13} className="text-amber-500" />
          <h3 className="text-sm font-bold text-[#111]">Subscription Renewals</h3>
        </div>
        <Link href="/subscriptions" className="text-xs text-[#aaa] hover:text-[#111] transition-colors">
          View all →
        </Link>
      </div>

      {expired > 0 && (
        <div className="px-5 py-2.5 bg-red-50 border-b border-red-100 flex items-center gap-2">
          <AlertTriangle size={11} className="text-red-500" />
          <span className="text-xs font-semibold text-red-600">{expired} expired subscription{expired !== 1 ? "s" : ""} need attention</span>
          <Link href="/subscriptions" className="ml-auto text-xs font-semibold text-red-500 hover:text-red-700">Review →</Link>
        </div>
      )}

      <div className="divide-y divide-[#F7F6F3]">
        {upcoming.map(sub => {
          const days = daysUntil(sub.endDate);
          const urgent = days <= 14;
          return (
            <div key={sub.id} className="px-5 py-3 flex items-center justify-between hover:bg-[#FAFAF9] transition-colors">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Link href={`/customers/${sub.customer.id}`} className="text-xs font-semibold text-[#111] hover:underline truncate">
                    {sub.customer.name}
                  </Link>
                  <span className="text-[10px] font-mono text-[#999] shrink-0">{sub.item.itemNumber}</span>
                </div>
                {sub.item.price != null && (
                  <p className="text-[10px] text-[#aaa]">${sub.item.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}/yr</p>
                )}
              </div>
              <div className="text-right shrink-0 ml-3">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${urgent ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"}`}>
                  {days === 0 ? "Today" : days < 0 ? `${Math.abs(days)}d ago` : `${days}d`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}