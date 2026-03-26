import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await prisma.$transaction(async (tx) => {
      // Collect child IDs we'll need for nested deletions
      const quotes = await tx.quote.findMany({
        where: { projectId: id },
        select: { id: true },
      });
      const quoteIds = quotes.map((q) => q.id);

      const boms = await tx.billOfMaterials.findMany({
        where: { projectId: id },
        select: { id: true },
      });
      const bomIds = boms.map((b) => b.id);

      // 1. Shipments (ShipmentLines cascade via onDelete: Cascade)
      await tx.shipment.deleteMany({ where: { projectId: id } });

      // 2. PurchaseOrders (PurchaseOrderLines cascade via onDelete: Cascade)
      await tx.purchaseOrder.deleteMany({ where: { projectId: id } });

      // 3. Clear depositInvoiceId on quotes so Invoice delete doesn't violate FK
      if (quoteIds.length > 0) {
        await tx.quote.updateMany({
          where: { id: { in: quoteIds } },
          data: { depositInvoiceId: null },
        });
      }

      // 4. Invoices (InvoiceLines cascade via onDelete: Cascade)
      await tx.invoice.deleteMany({ where: { projectId: id } });

      // 5. QuoteLines
      if (quoteIds.length > 0) {
        await tx.quoteLine.deleteMany({ where: { quoteId: { in: quoteIds } } });
      }

      // 6. QuoteBundles (refs Quote, BOM, SalesOrder — all nullable except quoteId)
      if (quoteIds.length > 0) {
        await tx.quoteBundle.deleteMany({ where: { quoteId: { in: quoteIds } } });
      }

      // 7. QuoteBOM join table
      if (quoteIds.length > 0) {
        await tx.quoteBOM.deleteMany({ where: { quoteId: { in: quoteIds } } });
      }

      // 8. Quotes
      await tx.quote.deleteMany({ where: { projectId: id } });

      // 9. SalesOrders (SalesOrderLines cascade via onDelete: Cascade)
      await tx.salesOrder.deleteMany({ where: { projectId: id } });

      // 10. BOMLines
      if (bomIds.length > 0) {
        await tx.bOMLine.deleteMany({ where: { bomId: { in: bomIds } } });
      }

      // 11. BillOfMaterials
      await tx.billOfMaterials.deleteMany({ where: { projectId: id } });

      // 12. TimeEntries
      await tx.timeEntry.deleteMany({ where: { projectId: id } });

      // 13. ProjectScopes
      await tx.projectScope.deleteMany({ where: { projectId: id } });

      // 14. Milestones
      await tx.projectMilestone.deleteMany({ where: { projectId: id } });

      // 15. ChangeOrders
      await tx.changeOrder.deleteMany({ where: { projectId: id } });

      // 16. Project
      await tx.project.delete({ where: { id } });
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to delete project:", err);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}
