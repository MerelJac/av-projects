import { prisma } from "@/lib/prisma";

export async function getProjectFinancials() {
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
    const outstanding = invoiced - collected;

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

  return { rows, totals };
}

export type ProjectFinancialRow = Awaited<
  ReturnType<typeof getProjectFinancials>
>["rows"][number];
