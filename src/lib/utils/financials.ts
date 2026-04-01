// lib/financials.ts
// Gloal financial calculations related to projects, quotes, purchase orders, etc.
// BE CAREFUL CHANGING THIS FILE - it's used in multiple places and changes can have wide impact.
// Define the minimal shape each calculator needs
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
  purchaseOrders: POSlice[],
  shipments: ShipmentSlice[],
) {
  // Includes draft, partially received, sent, and fully received PO Costs. Excludes Cancelled POs from Total.
  const activeLines = purchaseOrders
    .filter((po) => po.status !== "CANCELLED")
    .flatMap((po) => po.lines);

  const grossPoCost = activeLines.reduce((s, l) => s + l.cost * l.quantity, 0);
  const returnCredit = activeLines.reduce((s, l) => {
    const returned = l.returnedQuantity ?? 0;
    return s + l.cost * Math.max(0, returned);
  }, 0);
  const poCost = grossPoCost - returnCredit;
  const shippingCost = shipments.reduce((s, sh) => s + Number(sh.cost ?? 0), 0);
  return {
    grossPoCost,
    returnCredit,
    poCost,
    shippingCost,
    materialCost: poCost + shippingCost,
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
  shipments: ShipmentSlice[];
  scopes: ScopeSlice[];
  invoices: InvoiceSlice[];
}) {
  const { contractBase, changeOrderTotal, totalContract } = calcContractValue(
    p.quotes,
  );
  const { grossPoCost, returnCredit, poCost, shippingCost, materialCost } =
    calcMaterialCost(p.purchaseOrders, p.shipments);
  const {
    laborCost,
    budgetedLaborCost,
    totalActualHours,
    totalEstimatedHours,
  } = calcLaborCost(p.scopes);
  const { invoiced, collected, outstanding } = calcInvoicing(p.invoices);

  const cogs = materialCost + laborCost + shippingCost - returnCredit || 0;
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
    poCost,
    shippingCost,
    materialCost,
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
