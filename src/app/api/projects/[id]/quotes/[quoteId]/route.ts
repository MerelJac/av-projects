import { prisma } from "@/lib/prisma";
import { QuoteBundle, QuoteLine } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; quoteId: string }> }
) {
  const { id, quoteId } = await params;
  const { lines, bundles, status } = await req.json();

  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
  });

  if (!quote || quote.projectId !== id) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }

  const total = (lines as QuoteLine[]).reduce(
    (sum: number, l: QuoteLine) => sum + (l.price ?? 0) * (l.quantity ?? 1),
    0
  );

  await prisma.$transaction(async (tx) => {
    // 1. Null out all line bundleIds first to avoid FK violations
    await tx.quoteLine.updateMany({
      where: { quoteId },
      data: { bundleId: null },
    });

    // 2. Upsert bundles
    const bundleIdMap: Record<string, string> = {};
    for (const bundle of bundles as QuoteBundle[]) {
      const isTemp = bundle.id.startsWith("temp-");
      if (isTemp) {
        const created = await tx.quoteBundle.create({
          data: {
            quoteId,
            name: bundle.name,
            showToCustomer: bundle.showToCustomer ?? true,
          },
        });
        bundleIdMap[bundle.id] = created.id;
      } else {
        await tx.quoteBundle.update({
          where: { id: bundle.id },
          data: {
            name: bundle.name,
            showToCustomer: bundle.showToCustomer ?? true,
          },
        });
        bundleIdMap[bundle.id] = bundle.id;
      }
    }

    // 3. Delete removed bundles
    const incomingBundleIds = (bundles as QuoteBundle[])
      .filter((b: QuoteBundle) => !b.id.startsWith("temp-"))
      .map((b: QuoteBundle) => b.id);

    await tx.quoteBundle.deleteMany({
      where: {
        quoteId,
        id: { notIn: incomingBundleIds },
      },
    });

    // 4. Update each line with resolved bundleId
    for (const line of lines as QuoteLine[]) {
      const resolvedBundleId = line.bundleId
        ? (bundleIdMap[line.bundleId] ?? line.bundleId)
        : null;

      await tx.quoteLine.update({
        where: { id: line.id },
        data: {
          description: line.description,
          quantity: line.quantity,
          price: line.price,
          cost: line.cost ?? null,
          bundleId: resolvedBundleId,
        },
      });
    }

    // 5. Update quote status + total
    await tx.quote.update({
      where: { id: quoteId },
      data: { status, total },
    });
  });

  return NextResponse.json({ ok: true });
}