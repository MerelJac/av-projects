import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { bcFetchAll, BcCustomer } from "@/lib/bc";
import { getCustomerLocalBalances } from "@/lib/bc-local";
import ReportTable, { Column } from "../ReportTable";

type CustomerRow = {
  matchStatus: "linked" | "matched-by-name" | "local-only" | "bc-only";
  name: string | null;
  localBalance: number | null;
  bcBalance: number | null;
  totalBalance: number | null;
};

const COLUMNS: Column[] = [
  { key: "matchStatus", label: "Status", type: "match-badge" },
  { key: "name", label: "Name" },
  { key: "localBalance", label: "Antares AR", type: "currency" },
  { key: "bcBalance", label: "BC Balance", type: "currency" },
  { key: "totalBalance", label: "Total Balance", type: "currency" },
];

export default async function CustomerReportPage() {
  const [bcCustomers, localCustomers, localArMap] = await Promise.all([
    bcFetchAll<BcCustomer>("customers"),
    prisma.customer.findMany({ orderBy: { name: "asc" } }),
    getCustomerLocalBalances(),
  ]);

  const bcById = new Map(bcCustomers.map((c) => [c.id, c]));
  const bcByName = new Map(
    bcCustomers.map((c) => [c.displayName.toLowerCase().trim(), c]),
  );
  const matchedBcIds = new Set<string>();

  const rows: CustomerRow[] = [];
  const bcIdUpdates: { id: string; bcId: string }[] = [];

  for (const local of localCustomers) {
    let bcCustomer: BcCustomer | undefined;
    let matchStatus: CustomerRow["matchStatus"];

    if (local.bcId) {
      bcCustomer = bcById.get(local.bcId);
      matchStatus = "linked";
    } else {
      bcCustomer = bcByName.get(local.name.toLowerCase().trim());
      if (bcCustomer) {
        matchStatus = "matched-by-name";
        bcIdUpdates.push({ id: local.id, bcId: bcCustomer.id });
      } else {
        matchStatus = "local-only";
      }
    }

    if (bcCustomer) matchedBcIds.add(bcCustomer.id);

    const localAr = localArMap.get(local.id) ?? null;
    const bcAr = bcCustomer?.balanceDue ?? null;

    rows.push({
      matchStatus,
      name: local.name,
      localBalance: localAr,
      bcBalance: bcAr,
      totalBalance: (localAr ?? 0) + (bcAr ?? 0) || null,
    });
  }

  for (const bcc of bcCustomers) {
    if (!matchedBcIds.has(bcc.id)) {
      rows.push({
        matchStatus: "bc-only",
        name: bcc.displayName,
        localBalance: null,
        bcBalance: bcc.balanceDue ?? null,
        totalBalance: bcc.balanceDue ?? null,
      });
    }
  }

  if (bcIdUpdates.length > 0) {
    await Promise.all(
      bcIdUpdates.map(({ id, bcId }) =>
        prisma.customer.update({
          where: { id },
          data: { bcId, bcSyncedAt: new Date() },
        }),
      ),
    );
  }

  const ORDER = { linked: 0, "matched-by-name": 1, "local-only": 2, "bc-only": 3 };
  rows.sort((a, b) => ORDER[a.matchStatus] - ORDER[b.matchStatus]);

  const linked = rows.filter(
    (r) => r.matchStatus === "linked" || r.matchStatus === "matched-by-name",
  ).length;
  const unmatched = rows.filter(
    (r) => r.matchStatus === "local-only" || r.matchStatus === "bc-only",
  ).length;

  return (
    <div className="bg-[#F7F6F3] min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/reports/bc"
            className="p-1.5 rounded-lg text-[#999] hover:text-[#111] hover:bg-white transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#111] tracking-tight">
              Customer Report
            </h1>
            <p className="text-xs text-[#999] mt-0.5">
              {linked} linked · {unmatched} unmatched
              {bcIdUpdates.length > 0 &&
                ` · ${bcIdUpdates.length} auto-linked by name`}
            </p>
          </div>
        </div>

        <ReportTable
          title="Customers"
          columns={COLUMNS}
          rows={rows as unknown as Record<string, unknown>[]}
          filename="customer-report.csv"
        />
      </div>
    </div>
  );
}
