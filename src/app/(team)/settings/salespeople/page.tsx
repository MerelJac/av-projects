import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import SalepersonEditor from "./SalespersonEditor";

export default async function SalespeoplePage() {
  const salespeople = await prisma.salesperson.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

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
          <h1 className="text-2xl font-bold text-[#111] tracking-tight">
            Salespeople
          </h1>
          <p className="text-sm text-[#999] mt-1">
            Manage dropdown options for salespeople.
          </p>
        </div>

        <SalepersonEditor
          salespeople={salespeople}
        />
      </div>
    </div>
  );
}
