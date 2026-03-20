"use client";

import Link from "next/link";
import { DashboardData } from "./actions";
import {
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckSquare,
  Package,
  DollarSign,
  Activity,
  ChevronRight,
  Flag,
  Zap,
} from "lucide-react";

function fmt$(n: number) {
  return n >= 1000
    ? `$${(n / 1000).toFixed(1)}k`
    : `$${n.toLocaleString(undefined, { minimumFractionDigits: 0 })}`;
}

function fmtDate(d: Date | string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function daysAgo(d: Date | string) {
  return Math.floor((Date.now() - new Date(d).getTime()) / (1000 * 60 * 60 * 24));
}

function daysUntil(d: Date | string) {
  return Math.ceil((new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function BurnBar({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="text-xs text-[#aaa]">No estimate</span>;
  const clamped = Math.min(pct, 100);
  const color = pct > 90 ? "#ef4444" : pct > 70 ? "#f59e0b" : "#22c55e";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-[#F0EEE9] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${clamped}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-[11px] font-mono font-semibold" style={{ color }}>
        {pct.toFixed(0)}%
      </span>
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
  alert,
  href,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  accent: string;
  alert?: boolean;
  href?: string;
}) {
  const content = (
    <div
      className={`bg-white border rounded-2xl p-5 flex flex-col gap-3 hover:shadow-sm transition-shadow ${
        alert ? "border-red-200 bg-red-50/30" : "border-[#E5E3DE]"
      }`}
    >
      <div className="flex items-center justify-between">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${accent}18` }}
        >
          <Icon size={15} style={{ color: accent }} />
        </div>
        {alert && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-red-500 bg-red-100 px-2 py-0.5 rounded-full">
            Action needed
          </span>
        )}
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[#999] mb-1">
          {label}
        </p>
        <p className="text-2xl font-bold text-[#111] tracking-tight">{value}</p>
        {sub && <p className="text-xs text-[#aaa] mt-0.5">{sub}</p>}
      </div>
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

export default function TeamDashboardClient({ data }: { data: DashboardData }) {
  const { kpis, milestones, recentTimeEntries, projectBurn, openSalesOrders, openPOs, overdueInvoices } = data;

  return (
    <div className="bg-[#F7F6F3]">
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">

        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#111] tracking-tight">Dashboard</h1>
            <p className="text-sm text-[#888] mt-0.5">
              {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </div>
          {kpis.overdueCount > 0 && (
            <Link
              href="/invoices"
              className="flex items-center gap-2 text-sm font-semibold text-red-600 bg-red-50 border border-red-200 px-4 py-2 rounded-xl hover:bg-red-100 transition-colors"
            >
              <AlertTriangle size={14} />
              {kpis.overdueCount} overdue invoice{kpis.overdueCount > 1 ? "s" : ""} — {fmt$(kpis.overdueTotal)}
            </Link>
          )}
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          <KpiCard label="Projects" value={String(kpis.activeProjects)} icon={Activity} accent="#6366f1" href="/projects" />
          <KpiCard label="Open SOs" value={String(kpis.openSalesOrders)} sub={fmt$(kpis.openSOValue) + " pipeline"} icon={Package} accent="#0ea5e9" href="/sales-orders" />
          <KpiCard label="Revenue 30d" value={fmt$(kpis.revenue30d)} sub="Paid invoices" icon={DollarSign} accent="#22c55e" />
          <KpiCard label="Invoiced 30d" value={fmt$(kpis.invoiced30d)} sub="Awaiting payment" icon={TrendingUp} accent="#f59e0b" />
          <KpiCard
            label="Overdue"
            value={fmt$(kpis.overdueTotal)}
            sub={`${kpis.overdueCount} invoice${kpis.overdueCount !== 1 ? "s" : ""}`}
            icon={AlertTriangle}
            accent="#ef4444"
            alert={kpis.overdueCount > 0}
            href="/invoices"
          />
          <KpiCard label="Hours / Wk" value={kpis.hoursThisWeek.toFixed(1)} sub="This week" icon={Clock} accent="#8b5cf6" />
          <KpiCard
            label="Avg Margin"
            value={kpis.avgMargin != null ? `${kpis.avgMargin.toFixed(1)}%` : "—"}
            sub="Accepted quotes 30d"
            icon={Zap}
            accent="#f97316"
          />
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT: Project Hour Burn + WIP */}
          <div className="lg:col-span-2 space-y-6">

            {/* Hour Burn by Project */}
            <div className="bg-white border border-[#E5E3DE] rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#F0EEE9] flex items-center justify-between">
                <h2 className="text-sm font-bold text-[#111]">Hour Burn by Project</h2>
                <Link href="/projects" className="text-xs text-[#aaa] hover:text-[#111] transition-colors flex items-center gap-1">
                  All projects <ChevronRight size={12} />
                </Link>
              </div>
              <div className="divide-y divide-[#F7F6F3]">
                {projectBurn.length === 0 && (
                  <p className="px-5 py-8 text-sm text-[#bbb] text-center">No projects yet</p>
                )}
                {projectBurn.map(p => (
                  <div key={p.id} className="px-5 py-3.5 hover:bg-[#FAFAF9] transition-colors group">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="min-w-0">
                        <Link href={`/projects/${p.id}`} className="text-sm font-semibold text-[#111] hover:underline truncate block">
                          {p.name}
                        </Link>
                        <p className="text-[11px] text-[#aaa]">{p.customer}</p>
                      </div>
                      <div className="text-right ml-4 shrink-0">
                        <p className="text-xs font-mono font-semibold text-[#333]">
                          {p.logged.toFixed(1)}h
                          {p.estimated > 0 && <span className="text-[#bbb] font-normal"> / {p.estimated}h</span>}
                        </p>
                      </div>
                    </div>
                    <BurnBar pct={p.burn} />
                  </div>
                ))}
              </div>
            </div>

            {/* Open Sales Orders */}
            <div className="bg-white border border-[#E5E3DE] rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#F0EEE9] flex items-center justify-between">
                <h2 className="text-sm font-bold text-[#111]">Open Sales Orders</h2>
                <Link href="/sales-orders" className="text-xs text-[#aaa] hover:text-[#111] transition-colors flex items-center gap-1">
                  View all <ChevronRight size={12} />
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#F0EEE9]">
                      <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-[#999] px-5 py-2.5">Customer</th>
                      <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-[#999] px-3 py-2.5">Project</th>
                      <th className="text-right text-[10px] font-semibold uppercase tracking-widest text-[#999] px-3 py-2.5">Value</th>
                      <th className="text-right text-[10px] font-semibold uppercase tracking-widest text-[#999] px-5 py-2.5">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {openSalesOrders.length === 0 && (
                      <tr><td colSpan={4} className="px-5 py-8 text-sm text-[#bbb] text-center">No open sales orders</td></tr>
                    )}
                    {openSalesOrders.map(so => {
                      const value = so.lines.reduce((s, l) => s + Number(l.price) * l.quantity, 0);
                      return (
                        <tr key={so.id} className="border-b border-[#F7F6F3] last:border-0 hover:bg-[#FAFAF9] transition-colors">
                          <td className="px-5 py-3 text-sm font-medium text-[#111]">{so.customer.name}</td>
                          <td className="px-3 py-3 text-sm text-[#666]">{so.project?.name ?? "—"}</td>
                          <td className="px-3 py-3 text-right text-sm font-semibold text-[#111]">{fmt$(value)}</td>
                          <td className="px-5 py-3 text-right text-xs text-[#aaa]">{fmtDate(so.createdAt)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Open POs */}
            <div className="bg-white border border-[#E5E3DE] rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#F0EEE9] flex items-center justify-between">
                <h2 className="text-sm font-bold text-[#111]">Purchase Orders — WIP</h2>
                <Link href="/purchase-orders" className="text-xs text-[#aaa] hover:text-[#111] transition-colors flex items-center gap-1">
                  View all <ChevronRight size={12} />
                </Link>
              </div>
              <div className="divide-y divide-[#F7F6F3]">
                {openPOs.length === 0 && (
                  <p className="px-5 py-8 text-sm text-[#bbb] text-center">No open purchase orders</p>
                )}
                {openPOs.map(po => {
                  const totalQty = po.lines.reduce((s, l) => s + l.quantity, 0);
                  const receivedQty = po.lines.reduce((s, l) => s + l.receivedQuantity, 0);
                  const totalCost = po.lines.reduce((s, l) => s + l.cost * l.quantity, 0);
                  const pct = totalQty > 0 ? (receivedQty / totalQty) * 100 : 0;
                  const statusColor: Record<string, string> = {
                    DRAFT: "bg-gray-100 text-gray-500",
                    SENT: "bg-blue-50 text-blue-600",
                    PARTIALLY_RECEIVED: "bg-amber-50 text-amber-600",
                    RECEIVED: "bg-green-50 text-green-600",
                  };
                  return (
                    <div key={po.id} className="px-5 py-3.5 hover:bg-[#FAFAF9] transition-colors">
                      <div className="flex items-center justify-between mb-1.5">
                        <div>
                          <p className="text-sm font-semibold text-[#111]">{po.vendor?.name ?? "—"}</p>
                          <p className="text-[11px] text-[#aaa]">{po.project?.name ?? "No project"}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-semibold text-[#888]">{fmt$(totalCost)}</span>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusColor[po.status] ?? "bg-gray-100 text-gray-500"}`}>
                            {po.status.replace("_", " ")}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-[#F0EEE9] rounded-full overflow-hidden">
                          <div className="h-full bg-[#6366f1] rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[11px] font-mono text-[#888]">{receivedQty}/{totalQty} items</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT: Milestones + Hours + Overdue Billing */}
          <div className="space-y-6">

            {/* Overdue Milestones */}
            {milestones.overdue.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-red-200 flex items-center gap-2">
                  <AlertTriangle size={13} className="text-red-500" />
                  <h2 className="text-sm font-bold text-red-700">Overdue Milestones</h2>
                </div>
                <div className="divide-y divide-red-100">
                  {milestones.overdue.map(m => (
                    <div key={m.id} className="px-5 py-3">
                      <p className="text-sm font-semibold text-[#111]">{m.name}</p>
                      <p className="text-[11px] text-[#888]">{m.project.customer.name} · {m.project.name}</p>
                      <p className="text-[11px] font-semibold text-red-500 mt-0.5">
                        {daysAgo(m.dueDate!)} days overdue
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming Milestones */}
            <div className="bg-white border border-[#E5E3DE] rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#F0EEE9] flex items-center gap-2">
                <Flag size={13} className="text-[#888]" />
                <h2 className="text-sm font-bold text-[#111]">Upcoming Milestones</h2>
              </div>
              <div className="divide-y divide-[#F7F6F3]">
                {milestones.upcoming.length === 0 && (
                  <p className="px-5 py-8 text-sm text-[#bbb] text-center">No milestones in next 30 days</p>
                )}
                {milestones.upcoming.map(m => {
                  const days = daysUntil(m.dueDate!);
                  const urgent = days <= 7;
                  return (
                    <div key={m.id} className="px-5 py-3 hover:bg-[#FAFAF9] transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#111] truncate">{m.name}</p>
                          <p className="text-[11px] text-[#aaa]">{m.project.customer.name} · {m.project.name}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`text-xs font-bold ${urgent ? "text-amber-600" : "text-[#888]"}`}>
                            {days === 0 ? "Today" : days === 1 ? "Tomorrow" : `${days}d`}
                          </p>
                          <p className="text-[10px] text-[#bbb]">{fmtDate(m.dueDate)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Hours */}
            <div className="bg-white border border-[#E5E3DE] rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#F0EEE9] flex items-center gap-2">
                <Clock size={13} className="text-[#888]" />
                <h2 className="text-sm font-bold text-[#111]">Hours This Week</h2>
                <span className="ml-auto text-sm font-bold text-[#111]">{kpis.hoursThisWeek.toFixed(1)}h</span>
              </div>
              <div className="divide-y divide-[#F7F6F3]">
                {recentTimeEntries.length === 0 && (
                  <p className="px-5 py-8 text-sm text-[#bbb] text-center">No hours logged this week</p>
                )}
                {recentTimeEntries.map(entry => {
                  const name = [entry.user.profile?.firstName, entry.user.profile?.lastName].filter(Boolean).join(" ") || entry.user.email;
                  return (
                    <div key={entry.id} className="px-5 py-2.5 flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-[#F0EEE9] flex items-center justify-center text-[10px] font-bold text-[#888] shrink-0">
                        {name[0]?.toUpperCase() ?? "?"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-[#333] truncate">{entry.project.name}</p>
                        <p className="text-[10px] text-[#aaa] truncate">{entry.scope?.name ?? "General"} · {name}</p>
                      </div>
                      <span className="text-xs font-mono font-semibold text-[#555] shrink-0">{entry.hours}h</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Overdue Invoices */}
            {overdueInvoices.length > 0 && (
              <div className="bg-white border border-[#E5E3DE] rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-[#F0EEE9] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckSquare size={13} className="text-[#888]" />
                    <h2 className="text-sm font-bold text-[#111]">Overdue Billing</h2>
                  </div>
                  <span className="text-xs font-bold text-red-500">{fmt$(kpis.overdueTotal)}</span>
                </div>
                <div className="divide-y divide-[#F7F6F3]">
                  {overdueInvoices.map(inv => (
                    <div key={inv.id} className="px-5 py-3 hover:bg-[#FAFAF9] transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-[#111]">{inv.project.customer.name}</p>
                          <p className="text-[11px] text-[#aaa]">{inv.project.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-red-500">{fmt$(inv.amount ?? 0)}</p>
                          <p className="text-[10px] text-[#bbb]">{daysAgo(inv.issuedAt!)}d ago</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}