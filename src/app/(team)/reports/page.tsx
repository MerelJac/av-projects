import Link from "next/link";
import { getProjectFinancials } from "./data";
import { ArrowRight } from "lucide-react";

const fmt = (n: number) =>
  n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function pct(n: number, d: number) {
  if (d <= 0) return null;
  return ((n / d) * 100).toFixed(1);
}

export default async function ReportsPage() {
  const { rows, totals } = await getProjectFinancials();
  const wipCount = rows.filter(
    (r) => r.hasContract && r.invoiced < r.totalContract,
  ).length;

  return (
    <div className="bg-[#F7F6F3] min-h-screen">
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        <h1 className="text-2xl font-bold text-[#111] tracking-tight">
          Reports
        </h1>

        {/* Summary KPIs */}
        <div className="grid grid-cols-4 gap-4">
          {[
            {
              label: "Total Contract",
              value: `$${fmt(totals.totalContract)}`,
            },
            {
              label: "Total COGS",
              value: `$${fmt(totals.cogs)}`,
              sub: `$${fmt(totals.materialCost)} material · $${fmt(totals.laborCost)} labor · $${fmt(totals.shippingCost)} shipping`,
            },
            {
              label: "Gross Profit",
              value: `$${fmt(totals.grossProfit)}`,
              sub:
                totals.totalContract > 0
                  ? `${pct(totals.grossProfit, totals.totalContract)}% margin`
                  : undefined,
              highlight:
                totals.grossProfit >= 0 ? "text-green-600" : "text-red-600",
            },
            {
              label: "Outstanding AR",
              value: `$${fmt(totals.outstanding)}`,
              sub: `$${fmt(totals.collected)} collected`,
            },
          ].map((k) => (
            <div
              key={k.label}
              className="bg-white border border-[#E5E3DE] rounded-2xl px-6 py-5"
            >
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#999] mb-1">
                {k.label}
              </p>
              <p
                className={`text-2xl font-bold ${k.highlight ?? "text-[#111]"}`}
              >
                {k.value}
              </p>
              {k.sub && <p className="text-xs text-[#999] mt-0.5">{k.sub}</p>}
            </div>
          ))}
        </div>

        {/* Report links */}
        <div className="grid grid-cols-2 gap-4">
          <Link
            href="/reports/pl"
            className="bg-white border border-[#E5E3DE] rounded-2xl px-6 py-5 hover:border-[#111] transition-colors group flex items-center justify-between"
          >
            <div>
              <p className="text-sm font-bold text-[#111]">
                Project P&amp;L
              </p>
              <p className="text-xs text-[#999] mt-0.5">
                Contract, COGS, gross profit and margin by project
              </p>
            </div>
            <ArrowRight
              size={16}
              className="text-[#999] group-hover:text-[#111] transition-colors"
            />
          </Link>

          <Link
            href="/reports/wip"
            className="bg-white border border-[#E5E3DE] rounded-2xl px-6 py-5 hover:border-[#111] transition-colors group flex items-center justify-between"
          >
            <div>
              <p className="text-sm font-bold text-[#111]">
                Work in Progress
              </p>
              <p className="text-xs text-[#999] mt-0.5">
                {wipCount} project{wipCount !== 1 ? "s" : ""} with uninvoiced
                contract value
              </p>
            </div>
            <ArrowRight
              size={16}
              className="text-[#999] group-hover:text-[#111] transition-colors"
            />
          </Link>
        </div>
      </div>
    </div>
  );
}
