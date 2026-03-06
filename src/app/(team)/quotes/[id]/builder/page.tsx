import { prisma } from "@/lib/prisma";
import AddBundle from "../components/AddBundle";
import AddLine from "../components/AddLine";

export default async function QuoteBuilder({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const items = await prisma.item.findMany();
  const quote = await prisma.quote.findUnique({
    where: { id },
    include: {
      customer: true,
      lines: true,
      quoteBundles: {
        include: { lines: true },
      },
    },
  });

  if (!quote) return <div>Quote not found</div>;

  const total = [
    ...quote.lines,
    ...quote.quoteBundles.flatMap((b) => b.lines),
  ].reduce((sum, l) => sum + l.quantity * l.price, 0);

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Quote Builder</h1>

          <p className="text-gray-500">{quote.customer.name}</p>
        </div>

        <AddBundle quoteId={quote.id} />
      </div>

      {/* BUNDLES */}

      {quote.quoteBundles.map((bundle) => (
        <div key={bundle.id} className="border rounded-xl overflow-hidden">
          <div className="bg-gray-100 p-3 font-medium flex justify-between">
            {bundle.name}

            {!bundle.showToCustomer && (
              <span className="text-xs text-orange-500">
                hidden from customer
              </span>
            )}
          </div>
          {bundle.lines.map((line) => (
            <div key={line.id} className="grid grid-cols-4 p-4 border-b">
              <div>{line.description}</div>
              <div>{line.quantity}</div>
              <div>${line.price}</div>
              <div className="text-right">
                ${(line.quantity * line.price).toFixed(2)}
              </div>
            </div>
          ))}
          <div className="p-3 border-t">
            <AddLine quoteId={quote.id} bundleId={bundle.id} items={items} />
          </div>{" "}
        </div>
      ))}

      {/* UNBUNDLED LINES */}

      <div className="border rounded-xl p-4">
        <div className="font-medium mb-2">Individual Items</div>

        {quote.lines.map((line) => (
          <div key={line.id} className="grid grid-cols-4 p-4 border-b">
            <div>{line.description}</div>
            <div>{line.quantity}</div>
            <div>${line.price}</div>
            <div className="text-right">
              ${(line.quantity * line.price).toFixed(2)}
            </div>
          </div>
        ))}

        <AddLine quoteId={quote.id} items={items} />
      </div>

      <div className="flex justify-end text-lg font-semibold">
        Quote Total: ${total.toFixed(2)}
      </div>
    </div>
  );
}
