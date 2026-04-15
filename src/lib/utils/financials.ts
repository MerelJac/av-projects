type QuoteSlice = {
  total: number | null;
  status: string;
  isChangeOrder: boolean;
};
type ScopeSlice = {
  costPerHour: number | null;
  estimatedHours: number;
  timeEntries: { hours: number }[];
};
type InvoiceSlice = { amount: number | null; status: string };
type ProjectCostSlice = {
  costType: string;
  amount: number;
  amountPrice: number | null;
  taxAmount: number | null;
  taxAmountPrice: number | null;
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

export function calcCosts(projectCosts: ProjectCostSlice[]) {
  const byType = (type: string) =>
    projectCosts.filter((c) => c.costType === type);

  const materialEntries = byType("MATERIAL");
  const returnEntries = byType("RETURN");
  const freightEntries = byType("FREIGHT");
  const laborEntries = byType("LABOR");

  const grossPoCost = materialEntries.reduce((s, c) => s + c.amount, 0);
  // RETURN amounts are stored as negative
  const returnCredit = returnEntries.reduce(
    (s, c) => s + Math.abs(c.amount),
    0,
  );
  const poCostGrossMinusReturns = grossPoCost - returnCredit;
  const shippingCost = freightEntries.reduce((s, c) => s + c.amount, 0);
  const laborCost = laborEntries.reduce((s, c) => s + c.amount, 0);

  // Price-side (sell price) totals from BOM allocation records
  const grossPoPrice = materialEntries.reduce(
    (s, c) => s + (c.amountPrice ?? 0),
    0,
  );
  const returnCreditPrice = returnEntries.reduce(
    (s, c) => s + Math.abs(c.amountPrice ?? 0),
    0,
  );
  const netMaterialPrice = grossPoPrice - returnCreditPrice;

  // Tax across all non-return cost types (return tax is negative, naturally reduces total)
  const totalTax = projectCosts.reduce(
    (s, c) => s + (c.taxAmount ?? 0),
    0,
  );
  const totalTaxPrice = projectCosts.reduce(
    (s, c) => s + (c.taxAmountPrice ?? 0),
    0,
  );

  return {
    grossPoCost,
    returnCredit,
    poCostGrossMinusReturns,
    shippingCost,
    materialCosts: grossPoCost,
    laborCost,
    grossPoPrice,
    returnCreditPrice,
    netMaterialPrice,
    totalTax,
    totalTaxPrice,
  };
}

export function calcLaborEstimates(scopes: ScopeSlice[]) {
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
  return { budgetedLaborCost, totalActualHours, totalEstimatedHours };
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
  projectCosts: ProjectCostSlice[];
  scopes: ScopeSlice[];
  invoices: InvoiceSlice[];
}) {
  const { contractBase, changeOrderTotal, totalContract } = calcContractValue(
    p.quotes,
  );
  const {
    grossPoCost,
    returnCredit,
    poCostGrossMinusReturns,
    shippingCost,
    materialCosts,
    laborCost,
    grossPoPrice,
    returnCreditPrice,
    netMaterialPrice,
    totalTax,
    totalTaxPrice,
  } = calcCosts(p.projectCosts);
  const { budgetedLaborCost, totalActualHours, totalEstimatedHours } =
    calcLaborEstimates(p.scopes);
  const { invoiced, collected, outstanding } = calcInvoicing(p.invoices);

  const cogs = materialCosts + laborCost + shippingCost - returnCredit + totalTax;
  const grossProfit = totalContract - cogs;
  const marginPct =
    totalContract > 0 ? (grossProfit / totalContract) * 100 : null;
  const pctComplete =
    totalEstimatedHours > 0
      ? Math.min((totalActualHours / totalEstimatedHours) * 100, 100)
      : null;

  const materialMarkup =
    grossPoPrice > 0 ? ((grossPoPrice - grossPoCost) / grossPoCost) * 100 : null;

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
    grossPoPrice,
    returnCreditPrice,
    netMaterialPrice,
    totalTax,
    totalTaxPrice,
    materialMarkup,
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
