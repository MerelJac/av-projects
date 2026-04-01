import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { bcFetchAll, BcVendor } from "@/lib/bc";
import { getVendorLocalBalances } from "@/lib/bc-local";
import ReportTable, { Column } from "../ReportTable";

type VendorRow = {
  matchStatus: "linked" | "matched-by-name" | "local-only" | "bc-only";
  name: string | null;
  localBalance: number | null;
  bcBalance: number | null;
  totalBalance?: number | null;
};

const COLUMNS: Column[] = [
  { key: "matchStatus", label: "Status", type: "match-badge" },
  { key: "name", label: "Name" },

  { key: "localBalance", label: "Antares Balance", type: "currency" },
  { key: "bcBalance", label: "BC Balance", type: "currency" },
  { key: "totalBalance", label: "Total Balance", type: "currency" },
];

export default async function VendorReportPage() {
  const [bcVendors, localVendors, localBalanceMap] = await Promise.all([
    bcFetchAll<BcVendor>("vendors"),
    prisma.vendor.findMany({ orderBy: { name: "asc" } }),
    getVendorLocalBalances(),
  ]);

  // Build a lookup map: bcId → BcVendor
  const bcById = new Map(bcVendors.map((v) => [v.id, v]));
  // Build a lookup map: normalized name → BcVendor (for name matching)
  const bcByName = new Map(
    bcVendors.map((v) => [v.displayName.toLowerCase().trim(), v]),
  );

  // Track which BC vendors have been matched (to find BC-only at the end)
  const matchedBcIds = new Set<string>();

  const rows: VendorRow[] = [];
  const bcIdUpdates: { id: string; bcId: string }[] = [];

  for (const local of localVendors) {
    let bcVendor: BcVendor | undefined;
    let matchStatus: VendorRow["matchStatus"];

    if (local.bcId) {
      bcVendor = bcById.get(local.bcId);
      matchStatus = "linked";
    } else {
      bcVendor = bcByName.get(local.name.toLowerCase().trim());
      if (bcVendor) {
        matchStatus = "matched-by-name";
        bcIdUpdates.push({ id: local.id, bcId: bcVendor.id });
      } else {
        matchStatus = "local-only";
      }
    }

    if (bcVendor) matchedBcIds.add(bcVendor.id);

    const localBal = localBalanceMap.get(local.id);
    rows.push({
      matchStatus,
      name: local.name || bcVendor?.displayName || null,
      localBalance: localBal != null ? localBal : null,
      bcBalance: bcVendor?.balance ?? null,
      totalBalance:
        (localBal != null ? localBal : 0) + (bcVendor?.balance ?? 0),
    });
  }

  // BC vendors with no local match
  for (const bcv of bcVendors) {
    if (!matchedBcIds.has(bcv.id)) {
      rows.push({
        matchStatus: "bc-only",

        name: bcv.displayName,
        localBalance: null,

        bcBalance: bcv.balance ?? null,
        totalBalance: bcv.balance ?? null,
      });
    }
  }

  // Save auto-matched bcIds in the background
  if (bcIdUpdates.length > 0) {
    await Promise.all(
      bcIdUpdates.map(({ id, bcId }) =>
        prisma.vendor.update({
          where: { id },
          data: { bcId, bcSyncedAt: new Date() },
        }),
      ),
    );
  }

  const ORDER = {
    linked: 0,
    "matched-by-name": 1,
    "local-only": 2,
    "bc-only": 3,
  };
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
              Vendor Report
            </h1>
            <p className="text-xs text-[#999] mt-0.5">
              {linked} linked · {unmatched} unmatched
              {bcIdUpdates.length > 0 &&
                ` · ${bcIdUpdates.length} auto-linked by name`}
            </p>
          </div>
        </div>

        <ReportTable
          title="Vendors"
          columns={COLUMNS}
          rows={rows as unknown as Record<string, unknown>[]}
          filename="vendor-report.csv"
        />
      </div>
    </div>
  );
}
