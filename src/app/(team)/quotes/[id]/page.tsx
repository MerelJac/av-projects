import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function QuotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const quote = await prisma.quote.findUnique({
    where: { id },
    include: {
      customer: true,
      lines: true,
      quoteBundles: {
        where: { showToCustomer: true },
        include: { lines: true },
      },
    },
  });

  if (!quote) return <div>Quote not found</div>;

  const bundleLines = quote.quoteBundles.map((bundle) => ({
    description: bundle.name,
    quantity: 1,
    price: bundle.lines.reduce((sum, l) => sum + l.price * l.quantity, 0),
  }));

  const visibleLines = [...bundleLines, ...quote.lines];

  const total = visibleLines.reduce((sum, l) => sum + l.quantity * l.price, 0);

  return (
    <div className="max-w-4xl">
      <div className="flex flex-row justify-between">
        <h1 className="text-2xl font-semibold mb-6">Quote</h1>
        <Link href={`/quotes/${quote.id}/builder`}>Builder</Link>
      </div>
      <div className="border rounded-xl overflow-hidden">
        {visibleLines.map((line, i) => (
          <div key={i} className="grid grid-cols-4 p-4 border-b">
            <div>{line.description}</div>
            <div>{line.quantity}</div>
            <div>${line.price}</div>
            <div className="text-right">
              ${(line.quantity * line.price).toFixed(2)}
            </div>
          </div>
        ))}
      </div>

      <div className="text-right mt-4 font-semibold text-lg">
        Total: ${total.toFixed(2)}
      </div>
    </div>
  );
}
