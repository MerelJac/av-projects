import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getProjectFinancials } from "../data";

const fmt = (n: number) =>
  n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function pct(n: number, d: number) {
  if (d <= 0) return null;
  return ((n / d) * 100).toFixed(1);
}

export default async function PLReportPage() {
  const { rows, totals } = await getProjectFinancials();

  return (
    <div className="bg-[#F7F6F3] min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/reports"
            className="p-1.5 rounded-lg text-[#999] hover:text-[#111] hover:bg-white transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-2xl font-bold text-[#111] tracking-tight">
            Project P&amp;L
          </h1>
        </div>

        <div className="bg-white border border-[#E5E3DE] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#F0EEE9] text-[10px] font-semibold uppercase tracking-widest text-[#999]">
                  <th className="text-left px-6 py-3">Project</th>
                  <th className="text-right px-4 py-3">Contract</th>
                  <th className="text-right px-4 py-3">Material</th>
                  <th className="text-right px-4 py-3">Shipping</th>
                  <th className="text-right px-4 py-3">Labor</th>
                  <th className="text-right px-4 py-3">COGS</th>
                  <th className="text-right px-4 py-3">Gross Profit</th>
                  <th className="text-right px-4 py-3">Margin</th>
                  <th className="text-right px-6 py-3">Invoiced</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F7F6F3]">
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-[#FAFAF9] transition-colors group"
                  >
                    <td className="px-6 py-3">
                      <Link
                        href={`/projects/${r.id}`}
                        className="group-hover:underline"
                      >
                        <p className="font-medium text-[#111]">{r.name}</p>
                        <p className="text-xs text-[#999]">{r.customer}</p>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-[#111]">
                      {r.totalContract > 0 ? (
                        `$${fmt(r.totalContract)}`
                      ) : (
                        <span className="text-[#ccc]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-[#666]">
                      {r.materialCosts > 0 ? (
                        `$${fmt(r.materialCosts)}`
                      ) : (
                        <span className="text-[#ccc]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-[#666]">
                      {r.shippingCost > 0 ? (
                        `$${fmt(r.shippingCost)}`
                      ) : (
                        <span className="text-[#ccc]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-[#666]">
                      {r.laborCost > 0 ? (
                        `$${fmt(r.laborCost)}`
                      ) : (
                        <span className="text-[#ccc]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-[#666]">
                      {r.cogs > 0 ? (
                        `$${fmt(r.cogs)}`
                      ) : (
                        <span className="text-[#ccc]">—</span>
                      )}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-semibold ${
                        r.totalContract > 0
                          ? r.grossProfit >= 0
                            ? "text-green-600"
                            : "text-red-600"
                          : "text-[#ccc]"
                      }`}
                    >
                      {r.totalContract > 0 ? `$${fmt(r.grossProfit)}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-xs">
                      {r.marginPct !== null ? (
                        <span
                          className={`font-semibold ${
                            r.marginPct >= 30
                              ? "text-green-600"
                              : r.marginPct >= 0
                                ? "text-amber-600"
                                : "text-red-600"
                          }`}
                        >
                          {r.marginPct.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-[#ccc]">—</span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-right">
                      {r.invoiced > 0 ? (
                        <div>
                          <p className="text-[#111]">${fmt(r.invoiced)}</p>
                          {r.collected < r.invoiced && (
                            <p className="text-xs text-amber-600">
                              ${fmt(r.invoiced - r.collected)} outstanding
                            </p>
                          )}
                          {r.collected >= r.invoiced && r.invoiced > 0 && (
                            <p className="text-xs text-green-600">Collected</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-[#ccc]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-[#E5E3DE] bg-[#FAFAF9] text-sm font-semibold">
                  <td className="px-6 py-3 text-[#999] text-xs uppercase tracking-widest">
                    Total
                  </td>
                  <td className="px-4 py-3 text-right text-[#111]">
                    ${fmt(totals.totalContract)}
                  </td>
                  <td className="px-4 py-3 text-right text-[#666]">
                    ${fmt(totals.materialCost)}
                  </td>
                  <td className="px-4 py-3 text-right text-[#666]">
                    ${fmt(totals.shippingCost)}
                  </td>
                  <td className="px-4 py-3 text-right text-[#666]">
                    ${fmt(totals.laborCost)}
                  </td>
                  <td className="px-4 py-3 text-right text-[#666]">
                    ${fmt(totals.cogs)}
                  </td>
                  <td
                    className={`px-4 py-3 text-right ${totals.grossProfit >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    ${fmt(totals.grossProfit)}
                  </td>
                  <td className="px-4 py-3 text-right text-xs">
                    {totals.totalContract > 0 && (
                      <span
                        className={`font-semibold ${
                          (totals.grossProfit / totals.totalContract) * 100 >=
                          30
                            ? "text-green-600"
                            : "text-amber-600"
                        }`}
                      >
                        {pct(totals.grossProfit, totals.totalContract)}%
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-right text-[#111]">
                    ${fmt(totals.invoiced)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
