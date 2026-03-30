import { prisma } from "@/lib/prisma";
import Link from "next/link";

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
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { name: true } },
      quotes: { select: { total: true, status: true, isChangeOrder: true } },
      purchaseOrders: {
        where: { status: { not: "CANCELLED" } },
        include: { lines: { select: { cost: true, quantity: true } } },
      },
      shipments: { select: { cost: true } },
      scopes: {
        select: {
          costPerHour: true,
          estimatedHours: true,
          ratePerHour: true,
          timeEntries: { select: { hours: true } },
        },
      },
      invoices: {
        where: { status: { not: "VOID" } },
        select: { amount: true, status: true },
      },
    },
  });

  // Compute financials per project
  const rows = projects.map((p) => {
    const contractBase = p.quotes
      .filter((q) => q.status === "ACCEPTED" && !q.isChangeOrder)
      .reduce((s, q) => s + (q.total ?? 0), 0);
    const coTotal = p.quotes
      .filter((q) => q.status === "ACCEPTED" && q.isChangeOrder)
      .reduce((s, q) => s + (q.total ?? 0), 0);
    const totalContract = contractBase + coTotal;

    const poCost = p.purchaseOrders
      .flatMap((po) => po.lines)
      .reduce((s, l) => s + l.cost * l.quantity, 0);
    const shippingCost = p.shipments.reduce(
      (s, sh) => s + Number(sh.cost ?? 0),
      0,
    );
    const materialCost = poCost;

    const laborCost = p.scopes.reduce((s, sc) => {
      if (!sc.costPerHour) return s;
      const hrs = sc.timeEntries.reduce((h, t) => h + t.hours, 0);
      return s + hrs * sc.costPerHour;
    }, 0);

    const budgetedLaborCost = p.scopes.reduce((s, sc) => {
      if (!sc.costPerHour) return s;
      return s + sc.estimatedHours * sc.costPerHour;
    }, 0);

    const totalActualHours = p.scopes.reduce(
      (s, sc) => s + sc.timeEntries.reduce((h, t) => h + t.hours, 0),
      0,
    );
    const totalEstimatedHours = p.scopes.reduce(
      (s, sc) => s + sc.estimatedHours,
      0,
    );

    const cogs = materialCost + laborCost + shippingCost;
    const grossProfit = totalContract - cogs;
    const marginPct =
      totalContract > 0 ? (grossProfit / totalContract) * 100 : null;

    const invoiced = p.invoices.reduce((s, i) => s + (i.amount ?? 0), 0);
    const collected = p.invoices
      .filter((i) => i.status === "PAID")
      .reduce((s, i) => s + (i.amount ?? 0), 0);

    // WIP: earned revenue not yet collected (invoiced but unpaid)
    const outstanding = invoiced - collected;

    // Percent complete by hours (if hours exist)
    const pctComplete =
      totalEstimatedHours > 0
        ? Math.min((totalActualHours / totalEstimatedHours) * 100, 100)
        : null;

    return {
      id: p.id,
      name: p.name,
      customer: p.customer.name,
      totalContract,
      materialCost,
      shippingCost,
      laborCost,
      budgetedLaborCost,
      cogs,
      grossProfit,
      marginPct,
      invoiced,
      collected,
      outstanding,
      totalActualHours,
      totalEstimatedHours,
      pctComplete,
      hasContract: totalContract > 0,
    };
  });

  // Summary totals
  const totals = rows.reduce(
    (acc, r) => ({
      totalContract: acc.totalContract + r.totalContract,
      cogs: acc.cogs + r.cogs,
      materialCost: acc.materialCost + r.materialCost,
      shippingCost: acc.shippingCost + r.shippingCost,
      laborCost: acc.laborCost + r.laborCost,
      grossProfit: acc.grossProfit + r.grossProfit,
      invoiced: acc.invoiced + r.invoiced,
      collected: acc.collected + r.collected,
      outstanding: acc.outstanding + r.outstanding,
    }),
    {
      totalContract: 0,
      cogs: 0,
      materialCost: 0,
      shippingCost: 0,
      laborCost: 0,
      grossProfit: 0,
      invoiced: 0,
      collected: 0,
      outstanding: 0,
    },
  );

  const wipRows = rows.filter(
    (r) => r.hasContract && r.invoiced < r.totalContract,
  );

  return (
    <div className="bg-[#F7F6F3] min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        <h1 className="text-2xl font-bold text-[#111] tracking-tight">
          Reports
        </h1>

        {/* Summary KPIs */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Total Contract", value: `$${fmt(totals.totalContract)}` },
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

        {/* P&L Report */}
        <div className="bg-white border border-[#E5E3DE] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#F0EEE9]">
            <h2 className="text-sm font-bold text-[#111] uppercase tracking-widest">
              Project P&L
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#F0EEE9] text-[10px] font-semibold uppercase tracking-widest text-[#999]">
                  <th className="text-left px-6 py-3">Project</th>
                  <th className="text-right px-4 py-3">Contract Budget</th>
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
                      {r.materialCost > 0 ? (
                        `$${fmt(r.materialCost)}`
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
                      className={`px-4 py-3 text-right font-semibold ${r.totalContract > 0 ? (r.grossProfit >= 0 ? "text-green-600" : "text-red-600") : "text-[#ccc]"}`}
                    >
                      {r.totalContract > 0 ? `$${fmt(r.grossProfit)}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-xs">
                      {r.marginPct !== null ? (
                        <span
                          className={`font-semibold ${r.marginPct >= 30 ? "text-green-600" : r.marginPct >= 0 ? "text-amber-600" : "text-red-600"}`}
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
              {/* Totals row */}
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
                        className={`font-semibold ${(totals.grossProfit / totals.totalContract) * 100 >= 30 ? "text-green-600" : "text-amber-600"}`}
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

        {/* WIP Report */}
        <div className="bg-white border border-[#E5E3DE] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#F0EEE9] flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#111] uppercase tracking-widest">
                Work in Progress
              </h2>
              <p className="text-xs text-[#999] mt-0.5">
                Projects with contract value not yet fully invoiced
              </p>
            </div>
            <span className="text-xs text-[#999] font-medium">
              {wipRows.length} project{wipRows.length !== 1 ? "s" : ""}
            </span>
          </div>
          {wipRows.length === 0 ? (
            <p className="px-6 py-8 text-sm text-[#999] text-center">
              No active WIP projects.
            </p>
          ) : (
            <div className="overflow-x-auto">
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
