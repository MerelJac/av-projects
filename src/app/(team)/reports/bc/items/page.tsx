import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { bcFetchAll, BcItem } from "@/lib/bc";
import ReportTable, { Column } from "../ReportTable";

type ItemRow = {
  matchStatus: "linked" | "matched-by-number" | "local-only" | "bc-only";
  localId: string | null;
  localItemNumber: string | null;
  localDescription: string | null;
  localCost: number | null;
  localPrice: number | null;
  bcId: string | null;
  bcNumber: string | null;
  bcName: string | null;
  bcCost: number | null;
  bcPrice: number | null;
  bcType: string | null;
};

const COLUMNS: Column[] = [
  { key: "matchStatus", label: "Status", type: "match-badge" },
  { key: "localItemNumber", label: "Antares #" },
  { key: "localDescription", label: "Antares Description" },
  { key: "localCost", label: "Antares Cost", type: "currency" },
  { key: "localPrice", label: "Antares Price", type: "currency" },
  { key: "bcNumber", label: "BC #" },
  { key: "bcName", label: "BC Description" },
  { key: "bcCost", label: "BC Cost", type: "currency" },
  { key: "bcPrice", label: "BC Price", type: "currency" },
  { key: "bcType", label: "BC Type" },
  { key: "bcId", label: "BC ID" },
];

export default async function ItemReportPage() {
  const [bcItems, localItems] = await Promise.all([
    bcFetchAll<BcItem>("items"),
    prisma.item.findMany({ orderBy: { itemNumber: "asc" } }),
  ]);

  // Items match by item number (not name), then fall back to bcId
  const bcByNumber = new Map(bcItems.map((i) => [i.number.toLowerCase().trim(), i]));
  const bcById = new Map(bcItems.map((i) => [i.id, i]));
  const matchedBcIds = new Set<string>();

  const rows: ItemRow[] = [];
  const bcIdUpdates: { id: string; bcId: string }[] = [];

  for (const local of localItems) {
    let bcItem: BcItem | undefined;
    let matchStatus: ItemRow["matchStatus"];

    if (local.bcId) {
      bcItem = bcById.get(local.bcId);
      matchStatus = "linked";
    } else {
      bcItem = bcByNumber.get(local.itemNumber.toLowerCase().trim());
      if (bcItem) {
        matchStatus = "matched-by-number";
        bcIdUpdates.push({ id: local.id, bcId: bcItem.id });
      } else {
        matchStatus = "local-only";
      }
    }

    if (bcItem) matchedBcIds.add(bcItem.id);

    rows.push({
      matchStatus,
      localId: local.id,
      localItemNumber: local.itemNumber,
      localDescription: local.description ?? null,
      localCost: local.cost ?? null,
      localPrice: local.price ?? null,
      bcId: bcItem?.id ?? null,
      bcNumber: bcItem?.number ?? null,
      bcName: bcItem?.displayName ?? null,
      bcCost: bcItem?.unitCost ?? null,
      bcPrice: bcItem?.unitPrice ?? null,
      bcType: bcItem?.type ?? null,
    });
  }

  for (const bci of bcItems) {
    if (!matchedBcIds.has(bci.id)) {
      rows.push({
        matchStatus: "bc-only",
        localId: null,
        localItemNumber: null,
        localDescription: null,
        localCost: null,
        localPrice: null,
        bcId: bci.id,
        bcNumber: bci.number,
        bcName: bci.displayName,
        bcCost: bci.unitCost,
        bcPrice: bci.unitPrice,
        bcType: bci.type,
      });
    }
  }

  if (bcIdUpdates.length > 0) {
    await Promise.all(
      bcIdUpdates.map(({ id, bcId }) =>
        prisma.item.update({ where: { id }, data: { bcId, bcSyncedAt: new Date() } }),
      ),
    );
  }

  const ORDER = { linked: 0, "matched-by-number": 1, "local-only": 2, "bc-only": 3 };
  rows.sort((a, b) => ORDER[a.matchStatus] - ORDER[b.matchStatus]);

  const linked = rows.filter((r) => r.matchStatus === "linked" || r.matchStatus === "matched-by-number").length;
  const unmatched = rows.filter((r) => r.matchStatus === "local-only" || r.matchStatus === "bc-only").length;

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
            <h1 className="text-2xl font-bold text-[#111] tracking-tight">Item Report</h1>
            <p className="text-xs text-[#999] mt-0.5">
              {linked} linked · {unmatched} unmatched
              {bcIdUpdates.length > 0 && ` · ${bcIdUpdates.length} auto-linked by item number`}
            </p>
          </div>
        </div>

        <ReportTable
          title="Items"
          columns={COLUMNS}
          rows={rows as unknown as Record<string, unknown>[]}
          filename="item-report.csv"
        />
      </div>
    </div>
  );
}
