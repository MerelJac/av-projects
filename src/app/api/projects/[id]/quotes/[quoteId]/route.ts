import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; quoteId: string } }
) {
  const { lines, bundles, status } = await req.json();

  const quote = await prisma.quote.findUnique({
    where: { id: params.quoteId },
  });

  if (!quote || quote.projectId !== params.id) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }

  const total = (lines as any[]).reduce(
    (sum: number, l: any) => sum + (l.price ?? 0) * (l.quantity ?? 1),
    0
  );

  await prisma.$transaction(async (tx) => {
    // 1. Upsert bundles
    const bundleIdMap: Record<string, string> = {};
    for (const bundle of bundles as any[]) {
      const isTemp = bundle.id.startsWith("temp-");
      if (isTemp) {
        const created = await tx.quoteBundle.create({
          data: {
            quoteId: params.quoteId,
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

    // 2. Delete removed bundles
    const incomingBundleIds = (bundles as any[])
      .filter((b: any) => !b.id.startsWith("temp-"))
      .map((b: any) => b.id);

    await tx.quoteBundle.deleteMany({
      where: {
        quoteId: params.quoteId,
        id: { notIn: incomingBundleIds },
      },
    });

    // 3. Update each line
    for (const line of lines as any[]) {
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

    // 4. Update quote status + total
    await tx.quote.update({
      where: { id: params.quoteId },
      data: { status, total },
    });
  });

  return NextResponse.json({ ok: true });
}
