import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { CheckCircle2, Clock, RefreshCw, AlertTriangle } from "lucide-react";

function daysUntil(date: Date) {
  return Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function fmtDate(d: Date) {
  return new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

const STATUS_STYLES = {
  ACTIVE: "bg-green-50 text-green-700",
  PENDING_RENEWAL: "bg-amber-50 text-amber-700",
  EXPIRED: "bg-red-50 text-red-600",
};

const STATUS_ICONS = {
  ACTIVE: CheckCircle2,
  PENDING_RENEWAL: RefreshCw,
  EXPIRED: Clock,
};

export default async function SubscriptionsPage() {
  const subscriptions = await prisma.subscription.findMany({
    include: {
      item: { select: { id: true, itemNumber: true, manufacturer: true, price: true, category: true } },
      customer: { select: { id: true, name: true } },
    },
    orderBy: { endDate: "asc" },
  });

  const active = subscriptions.filter(s => s.status === "ACTIVE");
  const pendingRenewal = subscriptions.filter(s => s.status === "PENDING_RENEWAL");
  const expired = subscriptions.filter(s => s.status === "EXPIRED");
  const expiringSoon = active.filter(s => {
    const days = daysUntil(s.endDate);
    return days >= 0 && days <= 30;
  });

  const totalAnnualValue = subscriptions
    .filter(s => s.status === "ACTIVE" && s.item.price != null)
    .reduce((sum, s) => sum + (s.item.price ?? 0), 0);

  return (
    <div className="bg-[#F7F6F3]">
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">

        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#111] tracking-tight">Subscriptions</h1>
            <p className="text-sm text-[#888] mt-0.5">All customer subscription items</p>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-[#E5E3DE] rounded-2xl p-5">
            <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center mb-3">
              <CheckCircle2 size={15} className="text-green-500" />
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#999] mb-1">Active</p>
            <p className="text-2xl font-bold text-[#111]">{active.length}</p>
          </div>
          <div className={`border rounded-2xl p-5 ${expiringSoon.length > 0 ? "bg-amber-50 border-amber-200" : "bg-white border-[#E5E3DE]"}`}>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-3 ${expiringSoon.length > 0 ? "bg-amber-100" : "bg-[#F0EEE9]"}`}>
              <AlertTriangle size={15} className={expiringSoon.length > 0 ? "text-amber-500" : "text-[#999]"} />
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#999] mb-1">Expiring Soon</p>
            <p className={`text-2xl font-bold ${expiringSoon.length > 0 ? "text-amber-600" : "text-[#111]"}`}>{expiringSoon.length}</p>
            <p className="text-[10px] text-[#aaa] mt-0.5">Within 30 days</p>
          </div>
          <div className={`border rounded-2xl p-5 ${pendingRenewal.length > 0 ? "bg-amber-50 border-amber-200" : "bg-white border-[#E5E3DE]"}`}>
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center mb-3">
              <RefreshCw size={15} className="text-amber-500" />
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#999] mb-1">Pending Renewal</p>
            <p className="text-2xl font-bold text-[#111]">{pendingRenewal.length}</p>
          </div>
          <div className="bg-white border border-[#E5E3DE] rounded-2xl p-5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center mb-3">
              <span className="text-blue-500 font-bold text-xs">$</span>
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#999] mb-1">Annual Value</p>
            <p className="text-2xl font-bold text-[#111]">
              ${totalAnnualValue.toLocaleString(undefined, { minimumFractionDigits: 0 })}
            </p>
            <p className="text-[10px] text-[#aaa] mt-0.5">Active only</p>
          </div>
        </div>

        {/* Expiring Soon alert */}
        {expiringSoon.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-amber-200 flex items-center gap-2">
              <AlertTriangle size={13} className="text-amber-500" />
              <span className="text-sm font-bold text-amber-700">Expiring Within 30 Days</span>
            </div>
            <div className="divide-y divide-amber-100">
              {expiringSoon.map(sub => {
                const days = daysUntil(sub.endDate);
                return (
                  <div key={sub.id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Link href={`/customers/${sub.customer.id}`} className="text-sm font-semibold text-[#111] hover:underline">
                          {sub.customer.name}
                        </Link>
                        <span className="text-xs font-mono text-[#888]">{sub.item.itemNumber}</span>
                      </div>
                      <p className="text-[11px] text-[#888]">Expires {fmtDate(sub.endDate)}</p>
                    </div>
                    <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2.5 py-1 rounded-full">
                      {days === 0 ? "Today" : `${days}d left`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Full table */}
        <div className="bg-white border border-[#E5E3DE] rounded-2xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#F0EEE9]">
            <h2 className="text-sm font-bold text-[#111]">All Subscriptions</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-[#F0EEE9]">
                  <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-[#999] px-5 py-3">Customer</th>
                  <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-[#999] px-3 py-3">Item</th>
                  <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-[#999] px-3 py-3">Status</th>
                  <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-[#999] px-3 py-3">Start</th>
                  <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-[#999] px-3 py-3">End</th>
                  <th className="text-right text-[10px] font-semibold uppercase tracking-widest text-[#999] px-5 py-3">Value/yr</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-sm text-[#bbb]">No subscriptions yet</td>
                  </tr>
                )}
                {subscriptions.map(sub => {
                  const days = daysUntil(sub.endDate);
                  const StatusIcon = STATUS_ICONS[sub.status];
                  const isExpiringSoon = sub.status === "ACTIVE" && days >= 0 && days <= 30;
                  return (
                    <tr key={sub.id} className={`border-b border-[#F7F6F3] last:border-0 hover:bg-[#FAFAF9] transition-colors ${isExpiringSoon ? "border-l-2 border-amber-400" : ""}`}>
                      <td className="px-5 py-3.5">
                        <Link href={`/customers/${sub.customer.id}`} className="text-sm font-semibold text-[#111] hover:underline">
                          {sub.customer.name}
                        </Link>
                      </td>
                      <td className="px-3 py-3.5">
                        <p className="text-sm font-mono font-semibold text-[#111]">{sub.item.itemNumber}</p>
                        {sub.item.manufacturer && (
                          <p className="text-[11px] text-[#999]">{sub.item.manufacturer}</p>
                        )}
                      </td>
                      <td className="px-3 py-3.5">
                        <span className={`flex items-center gap-1.5 w-fit text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLES[sub.status]}`}>
                          <StatusIcon size={9} />
                          {sub.status.replace("_", " ")}
                        </span>
                        {isExpiringSoon && (
                          <p className="text-[10px] text-amber-600 font-semibold mt-0.5">{days}d left</p>
                        )}
                        {sub.status === "EXPIRED" && (
                          <p className="text-[10px] text-red-500 font-semibold mt-0.5">{Math.abs(days)}d ago</p>
                        )}
                      </td>
                      <td className="px-3 py-3.5 text-sm text-[#666]">{fmtDate(sub.startDate)}</td>
                      <td className="px-3 py-3.5 text-sm text-[#666]">{fmtDate(sub.endDate)}</td>
                      <td className="px-5 py-3.5 text-right text-sm font-semibold text-[#111]">
                        {sub.item.price != null
                          ? `$${sub.item.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                          : <span className="text-[#ccc] font-normal">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Expired section */}
        {expired.length > 0 && (
          <div className="bg-white border border-[#E5E3DE] rounded-2xl overflow-hidden opacity-60">
            <div className="px-5 py-3.5 border-b border-[#F0EEE9]">
              <h2 className="text-sm font-bold text-[#999]">Expired ({expired.length})</h2>
            </div>
            <div className="divide-y divide-[#F7F6F3]">
              {expired.map(sub => (
                <div key={sub.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Link href={`/customers/${sub.customer.id}`} className="text-sm font-semibold text-[#999] hover:underline">
                        {sub.customer.name}
                      </Link>
                      <span className="text-xs font-mono text-[#bbb]">{sub.item.itemNumber}</span>
                    </div>
                    <p className="text-[11px] text-[#bbb]">Ended {fmtDate(sub.endDate)}</p>
                  </div>
                  {sub.item.price != null && (
                    <span className="text-xs text-[#bbb]">
                      ${sub.item.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}/yr
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}