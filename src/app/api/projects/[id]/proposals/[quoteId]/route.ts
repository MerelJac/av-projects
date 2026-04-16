import { prisma } from "@/lib/prisma";
import { buildAuditLog } from "@/lib/audit";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { QuoteBundle, QuoteLine } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; quoteId: string }> },
) {
  const { id, quoteId } = await params;
  const { lines, bundles, status, isDirect, isChangeOrder, scopeOfWork, termsAndConditions, clientResponsibilities } = await req.json();

  console.log("=== QUOTE SAVE START ===");
  console.log("quoteId:", quoteId, "projectId:", id);
  console.log(
    "incoming lines:",
    JSON.stringify(
      lines.map((l: QuoteLine) => ({
        id: l.id,
        bundleId: l.bundleId,
        description: l.description,
      })),
      null,
      2,
    ),
  );
  console.log(
    "incoming bundles:",
    JSON.stringify(
      bundles.map((b: QuoteBundle) => ({
        id: b.id,
        name: b.name,
      })),
      null,
      2,
    ),
  );
  console.log("status:", status);

  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
  });

  if (!quote || quote.projectId !== id) {
    console.log("ERROR: Quote not found or project mismatch");
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }

  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? null;

  const total = (lines as QuoteLine[]).reduce(
    (sum: number, l: QuoteLine) => sum + (l.price ?? 0) * (l.quantity ?? 1),
    0,
  );
  console.log("computed total:", total);

  const statusChanged = status !== quote.status;

  await prisma.$transaction(async (tx) => {
    // 1. Null out all bundleIds first
    console.log("--- Step 1: nulling all bundleIds for quoteId", quoteId);
    const nullResult = await tx.quoteLine.updateMany({
      where: { quoteId },
      data: { bundleId: null },
    });
    console.log("nulled bundleIds on", nullResult.count, "lines");

    // 2. Upsert bundles
    console.log("--- Step 2: upserting", bundles.length, "bundles");
    const bundleIdMap: Record<string, string> = {};
    for (const bundle of bundles as QuoteBundle[]) {
      const isTemp = bundle.id.startsWith("temp-");
      if (isTemp) {
        console.log(
          "  creating new bundle:",
          bundle.name,
          "(was temp id:",
          bundle.id,
          ")",
        );
        const created = await tx.quoteBundle.create({
          data: {
            quoteId,
            name: bundle.name,
            showToCustomer: bundle.showToCustomer ?? true,
          },
        });
        bundleIdMap[bundle.id] = created.id;
        console.log("  created bundle with real id:", created.id);
      } else {
        console.log("  updating existing bundle:", bundle.id, bundle.name);
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
    console.log("bundleIdMap:", bundleIdMap);

    // 3. Update lines with resolved bundleIds
    console.log("--- Step 3: updating", lines.length, "lines");
    for (const line of lines as QuoteLine[]) {
      const resolvedBundleId = line.bundleId
        ? (bundleIdMap[line.bundleId] ?? null)
        : null;

      if (line.bundleId && !bundleIdMap[line.bundleId]) {
        console.log(
          "  WARNING: line",
          line.id,
          "has bundleId",
          line.bundleId,
          "but it's not in bundleIdMap — will be set to null",
        );
      }

      console.log(
        "  updating line:",
        line.id,
        "| bundleId:",
        line.bundleId,
        "→ resolved:",
        resolvedBundleId,
      );

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

    // 4. Delete removed bundles
    const incomingBundleIds = [
      // Real IDs from incoming bundles
      ...(bundles as QuoteBundle[])
        .filter((b) => !b.id.startsWith("temp-"))
        .map((b) => b.id),
      // Newly created IDs (mapped from temp IDs)
      ...Object.values(bundleIdMap),
    ];

    console.log("--- Step 4: deleting bundles NOT in:", incomingBundleIds);
    const deleted = await tx.quoteBundle.deleteMany({
      where: { quoteId, id: { notIn: incomingBundleIds } },
    });
    console.log("deleted", deleted.count, "bundles");

    // 5. Update quote status + total
    console.log("--- Step 5: updating quote status:", status, "total:", total);
    await tx.quote.update({
      where: { id: quoteId },
      data: {
        status,
        total,
        isDirect: isDirect ?? false,
        isChangeOrder: isChangeOrder ?? false,
        scopeOfWork: scopeOfWork ?? null,
        termsAndConditions: termsAndConditions ?? null,
        clientResponsibilities: clientResponsibilities ?? null,
      },
    });

    // 6. Audit log
    await tx.auditLog.create({
      data: buildAuditLog(
        "QUOTE",
        quoteId,
        statusChanged ? "STATUS_CHANGE" : "UPDATE",
        userId,
        statusChanged
          ? `Status changed from ${quote.status} to ${status}`
          : `Quote updated (total: $${total.toFixed(2)})`
      ),
    });
  });

  console.log("=== QUOTE SAVE COMPLETE ===");
  return NextResponse.json({ ok: true });
}
