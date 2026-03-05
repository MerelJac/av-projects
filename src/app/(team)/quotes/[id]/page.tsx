import { prisma } from "@/lib/prisma";
import QuoteLinesTable from "./components/QuoteLinesTable";
import QuoteSummary from "./components/QuoteSummary";
import AddItemModal from "./components/AddItemModal";

export default async function QuotePage({
  params,
}: {
  params: { id: string };
}) {
  const quote = await prisma.quote.findUnique({
    where: { id: params.id },
    include: {
      lines: true,
    },
  });

  const items = await prisma.item.findMany();

  if (!quote) return <div>Quote not found</div>;

  return (
    <div className="flex gap-6">

      <div className="flex-1">

        <div className="flex justify-between mb-6">

          <h1 className="text-2xl font-semibold">
            Quote Builder
          </h1>

          <AddItemModal items={items} onAdd={() => {}} />

        </div>

        <QuoteLinesTable lines={quote.lines} />

      </div>

      <div className="w-[300px]">

        <QuoteSummary lines={quote.lines} />

      </div>

    </div>
  );
}