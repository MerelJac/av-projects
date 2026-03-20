import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
 
// Returns the set of salesOrderLineIds already linked to a PO line
// so the modal can disable those checkboxes.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const quoteId = req.nextUrl.searchParams.get("quoteId");
 
  const poLines = await prisma.purchaseOrderLine.findMany({
    where: {
      purchaseOrder: { projectId: id },
      salesOrderLineId: { not: null },
      ...(quoteId
        ? { purchaseOrder: { projectId: id, quoteId } }
        : {}),
    },
    select: { salesOrderLineId: true },
  });
 
  const claimedIds = poLines
    .map((l) => l.salesOrderLineId)
    .filter(Boolean) as string[];
 
  return NextResponse.json(claimedIds);
}
 