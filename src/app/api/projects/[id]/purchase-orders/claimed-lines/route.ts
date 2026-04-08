// src/app/api/projects/[id]/purchase-orders/claimed-lines/route.ts
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Returns itemIds already on a PO line for this project (with quantity)
// so the modal can disable those checkboxes when qty matches. 
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const poLines = await prisma.purchaseOrderLine.findMany({
    where: { purchaseOrder: { projectId: id } },
    include: { purchaseOrder: { select: { poNumber: true, status: true } } },
  });

  const claimed = poLines.map((l) => ({
    itemId: l.itemId,
    quantity: l.quantity,
    receivedQuantity: l.receivedQuantity,
    poStatus: l.purchaseOrder.status,
    po: l.poId,
    poNumber: l.purchaseOrder.poNumber,
  }));
  console.log("claimed lines from server", claimed);
  return NextResponse.json(claimed);
}
