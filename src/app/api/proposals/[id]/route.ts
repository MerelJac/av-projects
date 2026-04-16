import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await prisma.$transaction(async (tx) => {
      // Clear depositInvoiceId so invoices can be deleted without FK conflict
      await tx.quote.update({
        where: { id },
        data: { depositInvoiceId: null },
      });

      await tx.quoteLine.deleteMany({ where: { quoteId: id } });
      await tx.quoteBundle.deleteMany({ where: { quoteId: id } });
      await tx.quoteBOM.deleteMany({ where: { quoteId: id } });
      await tx.quote.delete({ where: { id } });
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to delete quote:", err);
    return NextResponse.json(
      { error: "Failed to delete quote" },
      { status: 500 }
    );
  }
}
