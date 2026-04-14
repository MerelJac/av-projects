import { prisma } from "@/lib/prisma";
import { calcProjectFinancials } from "@/lib/utils/financials";

export async function getProjectFinancials() {
  const [projects, returnedQtyRows] = await Promise.all([
    prisma.project.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { name: true } },
        quotes: { select: { total: true, status: true, isChangeOrder: true } },
        purchaseOrders: {
          include: {
            lines: { select: { cost: true, quantity: true, id: true } },
          },
        },
        costs: { select: { costType: true, amount: true, taxAmount: true } },
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
          select: { amount: true, status: true },
        },
      },
    }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma as any).purchaseOrderReturnLine
      .groupBy({
        by: ["poLineId"],
        where: { poReturn: { status: "CREDITED" } },
        _sum: { quantity: true },
      })
      .catch(
        () => [] as { poLineId: string; _sum: { quantity: number | null } }[],
      ),
  ]);

  const returnedQtyByLineId: Record<string, number> = {};
  for (const row of returnedQtyRows) {
    returnedQtyByLineId[row.poLineId] = row._sum.quantity ?? 0;
  }

  const rows = projects.map((p) => ({
    id: p.id,
    name: p.name,
    customer: p.customer.name,
    ...calcProjectFinancials({
      ...p,
      projectCosts: p.costs,
    }),
  }));

  const totals = rows.reduce(
    (acc, r) => ({
      totalContract: acc.totalContract + r.totalContract,
      cogs: acc.cogs + r.cogs,
      materialCost: acc.materialCost + r.materialCosts,
      shippingCost: acc.shippingCost + r.shippingCost,
      laborCost: acc.laborCost + r.laborCost,
      grossProfit: acc.grossProfit + r.grossProfit,
      invoiced: acc.invoiced + r.invoiced,
      collected: acc.collected + r.collected,
      outstanding: acc.outstanding + r.outstanding,
      returnCredit: acc.returnCredit + r.returnCredit,
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
      returnCredit: 0,
    },
  );

  return { rows, totals };
}

export type ProjectFinancialRow = Awaited<
  ReturnType<typeof getProjectFinancials>
>["rows"][number];
