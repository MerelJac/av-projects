import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ItemOptionsEditor from "./ItemOptionsEditor";

export default async function ItemOptionsPage() {
  const [categories, units] = await Promise.all([
    prisma.itemDropdownOption.findMany({
      where: { field: "category" },
      orderBy: { value: "asc" },
      select: { id: true, value: true },
    }),
    prisma.itemDropdownOption.findMany({
      where: { field: "unit" },
      orderBy: { value: "asc" },
      select: { id: true, value: true },
    }),
  ]);

  return (
    <div className="bg-[#F7F6F3] min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <Link
          href="/settings"
          className="flex items-center gap-2 text-sm text-[#666] hover:text-[#111] mb-6 transition-colors"
        >
          <ArrowLeft size={15} />
          Settings
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#111] tracking-tight">Item Options</h1>
          <p className="text-sm text-[#999] mt-1">
            Manage dropdown options for item categories and units.
          </p>
        </div>

        <ItemOptionsEditor
          initialCategories={categories}
          initialUnits={units}
        />
      </div>
    </div>
  );
}
