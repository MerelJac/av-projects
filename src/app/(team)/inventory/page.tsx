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
        },
      },
      shipment: { select: { id: true, createdAt: true } },
      invoice: { select: { id: true, invoiceNumber: true } },
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
    onHand: number;
    totalReceived: number;
    totalInvoiced: number;
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
        onHand: 0,
        totalReceived: 0,
        totalInvoiced: 0,
        lastMovementAt: m.createdAt,
        movements: [],
      });
    }
    const entry = byItem.get(m.itemId)!;
    entry.onHand += m.quantityDelta;
    if (m.type === "RECEIPT") entry.totalReceived += m.quantityDelta;
    if (m.type === "INVOICE") entry.totalInvoiced += Math.abs(m.quantityDelta);
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
    movements: r.movements.map((m) => ({
      id: m.id,
      type: m.type,
      quantityDelta: m.quantityDelta,
      notes: m.notes,
      createdAt: new Date(m.createdAt).toISOString(),
      invoiceNumber: m.invoice?.invoiceNumber ?? null,
    })),
  }));

  return <InventoryReport rows={serialized} />;
}
