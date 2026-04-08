import { prisma } from "@/lib/prisma";
import InventoryReport from "./InventoryReport";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const movements: any[] = await (prisma as any).inventoryMovement.findMany({
    include: {
      item: {
        select: {
          id: true,
          itemNumber: true,
          description: true,
          manufacturer: true,
          type: true,
          unit: true,
          cost: true,
        },
      },
      shipment: { include: { purchaseOrder: true } },
      invoice: { select: { id: true, invoiceNumber: true } },
      bomLine: {
        include: {
          bom: {
            include: {
              project: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  // Group movements by item
  type ItemSummary = {
    id: string;
    itemNumber: string;
    description: string | null;
    manufacturer: string | null;
    type: string;
    unit: string | null;
    unitCost: number | null;
    onHand: number;
    totalReceived: number;
    totalAllocated: number;
    lastMovementAt: Date;
    movements: typeof movements;
  };

  const byItem = new Map<string, ItemSummary>();

  for (const m of movements) {
    if (!m.item) continue;
    if (!byItem.has(m.itemId)) {
      byItem.set(m.itemId, {
        id: m.item.id,
        itemNumber: m.item.itemNumber,
        description: m.item.description,
        manufacturer: m.item.manufacturer,
        type: m.item.type,
        unit: m.item.unit,
        unitCost: m.item.cost ?? null,
        onHand: 0,
        totalReceived: 0,
        totalAllocated: 0,
        lastMovementAt: m.createdAt,
        movements: [],
      });
    }
    const entry = byItem.get(m.itemId)!;
    entry.onHand += m.quantityDelta;
    if (m.type === "RECEIPT") entry.totalReceived += m.quantityDelta;
    if (m.type === "BOM_ALLOCATION" || m.type === "INVOICE") entry.totalAllocated += Math.abs(m.quantityDelta);
    if (new Date(m.createdAt) > new Date(entry.lastMovementAt)) {
      entry.lastMovementAt = m.createdAt;
    }
    entry.movements.push(m);
  }

  const rows = Array.from(byItem.values()).sort((a, b) =>
    a.itemNumber.localeCompare(b.itemNumber),
  );

  // Serialize dates for client component
  const serialized = rows.map((r) => ({
    ...r,
    lastMovementAt: r.lastMovementAt.toISOString(),
    movements: r.movements.map((m) => {
      const qty = Math.abs(m.quantityDelta);
      const costAmount = r.unitCost != null ? r.unitCost * qty : null;
      return {
        id: m.id,
        type: m.type,
        quantityDelta: m.quantityDelta,
        notes: m.notes,
        createdAt: new Date(m.createdAt).toISOString(),
        invoiceNumber: m.invoice?.invoiceNumber ?? null,
        purchaseOrderNumber: m.shipment?.purchaseOrder?.poNumber ?? null,
        projectId: m.bomLine?.bom?.project?.id ?? null,
        projectName: m.bomLine?.bom?.project?.name ?? null,
        costAmount,
      };
    }),
  }));

  return <InventoryReport rows={serialized} />;
}
