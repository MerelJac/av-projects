import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getProjectFinancials } from "../data";

const fmt = (n: number) =>
  n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default async function WIPReportPage() {
  const { rows } = await getProjectFinancials();
  const wipRows = rows.filter(
    (r) => r.hasContract && r.invoiced < r.totalContract,
  );

  const totalRemaining = wipRows.reduce(
    (s, r) => s + (r.totalContract - r.invoiced),
    0,
  );

  return (
    <div className="bg-[#F7F6F3] min-h-screen">
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/reports"
            className="p-1.5 rounded-lg text-[#999] hover:text-[#111] hover:bg-white transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#111] tracking-tight">
              Work in Progress
            </h1>
            <p className="text-xs text-[#999] mt-0.5">
              {wipRows.length} project{wipRows.length !== 1 ? "s" : ""} ·{" "}
              ${fmt(totalRemaining)} remaining to invoice
            </p>
          </div>
        </div>

        <div className="bg-white border border-[#E5E3DE] rounded-2xl overflow-hidden">
          {wipRows.length === 0 ? (
            <p className="px-6 py-12 text-sm text-[#999] text-center">
              No active WIP projects.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#F0EEE9] text-[10px] font-semibold uppercase tracking-widest text-[#999]">
                  <th className="text-left px-6 py-3">Project</th>
                  <th className="text-right px-4 py-3">Contract</th>
                  <th className="text-right px-4 py-3">Invoiced</th>
                  <th className="text-right px-4 py-3">Remaining</th>
                  <th className="text-right px-4 py-3">Hours</th>
                  <th className="text-right px-6 py-3">% Complete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F7F6F3]">
                {wipRows.map((r) => {
                  const remaining = r.totalContract - r.invoiced;
                  return (
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
                        ${fmt(r.totalContract)}
                      </td>
                      <td className="px-4 py-3 text-right text-[#666]">
                        {r.invoiced > 0 ? (
                          `$${fmt(r.invoiced)}`
                        ) : (
                          <span className="text-[#ccc]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-amber-600">
                        ${fmt(remaining)}
                      </td>
                      <td className="px-4 py-3 text-right text-[#666]">
                        {r.totalEstimatedHours > 0 ? (
                          <span>
                            {r.totalActualHours.toFixed(1)}
                            <span className="text-[#ccc]">
                              {" "}
                              / {r.totalEstimatedHours.toFixed(1)}
                            </span>
                          </span>
                        ) : (
                          <span className="text-[#ccc]">—</span>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        {r.pctComplete !== null ? (
                          <div className="flex items-center gap-2 justify-end">
                            <div className="w-20 h-1.5 bg-[#F0EEE9] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-green-500 rounded-full"
                                style={{ width: `${r.pctComplete}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-[#666] w-10 text-right">
                              {r.pctComplete.toFixed(0)}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-[#ccc] text-right block">
                            —
                          </span>
                        )}
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
