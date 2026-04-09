// lib/financials.ts
type QuoteSlice = {
  total: number | null;
  status: string;
  isChangeOrder: boolean;
};
type POLineSlice = {
  cost: number;
  quantity: number;
  returnedQuantity?: number;
};
type POSlice = { status: string; lines: POLineSlice[] };
type ShipmentSlice = { cost: unknown };
type ScopeSlice = {
  costPerHour: number | null;
  estimatedHours: number;
  timeEntries: { hours: number }[];
};
type InvoiceSlice = { amount: number | null; status: string };
type ProjectCostSlice = {
  costType: string;
  amount: number;
};

export function calcContractValue(quotes: QuoteSlice[]) {
  const contractBase = quotes
    .filter((q) => q.status === "ACCEPTED" && !q.isChangeOrder)
    .reduce((s, q) => s + (q.total ?? 0), 0);
  const changeOrderTotal = quotes
    .filter((q) => q.status === "ACCEPTED" && q.isChangeOrder)
    .reduce((s, q) => s + (q.total ?? 0), 0);
  return {
    contractBase,
    changeOrderTotal,
    totalContract: contractBase + changeOrderTotal,
  };
}

export function calcMaterialCost(
  projectCosts: ProjectCostSlice[],
  shipments: ShipmentSlice[],
) {
  const materialCosts = projectCosts.filter((c) => c.costType === "MATERIAL");
  const returnCosts = projectCosts.filter((c) => c.costType === "RETURN");
  const freightCosts = projectCosts.filter((c) => c.costType === "FREIGHT");

  const grossPoCost = materialCosts.reduce((s, c) => s + c.amount, 0);
  // RETURN amounts are stored as negative, so we subtract them (double negative = add back credit)
  const returnCredit = returnCosts.reduce((s, c) => s + Math.abs(c.amount), 0);
  const poCostGrossMinusReturns = grossPoCost - returnCredit;
  const shippingCost =
    shipments.reduce((s, sh) => s + Number(sh.cost ?? 0), 0) +
    freightCosts.reduce((s, c) => s + c.amount, 0);

  return {
    grossPoCost,
    returnCredit,
    poCostGrossMinusReturns,
    shippingCost,
    materialCosts: materialCosts.reduce((s, c) => s + c.amount, 0),
  };
}

export function calcLaborCost(scopes: ScopeSlice[]) {
  const laborCost = scopes.reduce((s, sc) => {
    if (!sc.costPerHour) return s;
    const hrs = sc.timeEntries.reduce((h, t) => h + t.hours, 0);
    return s + hrs * sc.costPerHour;
  }, 0);
  const budgetedLaborCost = scopes.reduce((s, sc) => {
    if (!sc.costPerHour) return s;
    return s + sc.estimatedHours * sc.costPerHour;
  }, 0);
  const totalActualHours = scopes.reduce(
    (s, sc) => s + sc.timeEntries.reduce((h, t) => h + t.hours, 0),
    0,
  );
  const totalEstimatedHours = scopes.reduce(
    (s, sc) => s + sc.estimatedHours,
    0,
  );
  return {
    laborCost,
    budgetedLaborCost,
    totalActualHours,
    totalEstimatedHours,
  };
}

export function calcInvoicing(invoices: InvoiceSlice[]) {
  const nonVoid = invoices.filter((i) => i.status !== "VOID");
  const invoiced = nonVoid.reduce((s, i) => s + (i.amount ?? 0), 0);
  const collected = nonVoid
    .filter((i) => i.status === "PAID")
    .reduce((s, i) => s + (i.amount ?? 0), 0);
  return { invoiced, collected, outstanding: invoiced - collected };
}

export function calcProjectFinancials(p: {
  quotes: QuoteSlice[];
  purchaseOrders: POSlice[];
  projectCosts: ProjectCostSlice[];
  shipments: ShipmentSlice[];
  scopes: ScopeSlice[];
  invoices: InvoiceSlice[];
}) {
  const { contractBase, changeOrderTotal, totalContract } = calcContractValue(
    p.quotes,
  );
  const { grossPoCost, returnCredit, poCostGrossMinusReturns, shippingCost, materialCosts } =
    calcMaterialCost(p.projectCosts, p.shipments);
  const {
    laborCost,
    budgetedLaborCost,
    totalActualHours,
    totalEstimatedHours,
  } = calcLaborCost(p.scopes);
  const { invoiced, collected, outstanding } = calcInvoicing(p.invoices);

  const cogs = materialCosts + laborCost + shippingCost - returnCredit;
  const grossProfit = totalContract - cogs;
  const marginPct =
    totalContract > 0 ? (grossProfit / totalContract) * 100 : null;
  const pctComplete =
    totalEstimatedHours > 0
      ? Math.min((totalActualHours / totalEstimatedHours) * 100, 100)
      : null;

  return {
    contractBase,
    changeOrderTotal,
    totalContract,
    grossPoCost,
    returnCredit,
    poCostGrossMinusReturns,
    shippingCost,
    materialCosts,
    laborCost,
    budgetedLaborCost,
    totalActualHours,
    totalEstimatedHours,
    cogs,
    grossProfit,
    marginPct,
    invoiced,
    collected,
    outstanding,
    pctComplete,
    hasContract: totalContract > 0,
  };
}

export type ProjectFinancials = ReturnType<typeof calcProjectFinancials>;