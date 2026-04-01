import { prisma } from "@/lib/prisma";

/**
 * Returns a map of vendorId → total open PO value (quantity × cost),
 * excluding DRAFT and CANCELLED purchase orders.
 */
export async function getVendorLocalBalances(): Promise<Map<string, number>> {
  const poLines = await prisma.purchaseOrderLine.findMany({
    where: {
      purchaseOrder: {
        status: { notIn: ["DRAFT", "CANCELLED"] },
        vendorId: { not: null },
      },
    },
    select: {
      quantity: true,
      cost: true,
      purchaseOrder: { select: { vendorId: true } },
    },
  });

  const map = new Map<string, number>();
  for (const line of poLines) {
    const vendorId = line.purchaseOrder.vendorId;
    if (!vendorId) continue;
    map.set(vendorId, (map.get(vendorId) ?? 0) + line.quantity * line.cost);
  }
  return map;
}

/**
 * Returns a map of customerId → total outstanding AR (unpaid SENT/PENDING/REVISED invoices).
 */
export async function getCustomerLocalBalances(): Promise<Map<string, number>> {
  const invoices = await prisma.invoice.findMany({
    where: {
      status: { in: ["SENT", "PENDING", "REVISED"] },
      paidAt: null,
      amount: { not: null },
    },
    select: {
      amount: true,
      project: { select: { customerId: true } },
    },
  });

  const map = new Map<string, number>();
  for (const inv of invoices) {
    const customerId = inv.project.customerId;
    map.set(customerId, (map.get(customerId) ?? 0) + (inv.amount ?? 0));
  }
  return map;
}
