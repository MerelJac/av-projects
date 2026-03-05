import { prisma } from "@/lib/prisma";

export default async function QuoteBuilder({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const quote = await prisma.quote.findUnique({
    where: { id },
    include: {
      lines: true,
      customer: true,
    },
  });

  if (!quote) return <div>Quote not found</div>;

  const total = quote.lines.reduce(
    (sum, l) => sum + l.quantity * l.price,
    0
  );

  return (
    <div className="flex flex-col gap-6 max-w-5xl">

      {/* HEADER */}

      <div className="flex justify-between items-center">

        <div>
          <h1 className="text-2xl font-semibold">
            Quote Builder
          </h1>

          <p className="text-gray-500">
            {quote.customer.name}
          </p>
        </div>

        <div className="flex gap-3">
          <button className="border px-4 py-2 rounded-lg">
            + Add Bundle
          </button>

          <button className="border px-4 py-2 rounded-lg">
            + Add Line
          </button>
        </div>

      </div>

      {/* TABLE */}

      <div className="border rounded-xl bg-white overflow-hidden">

        <div className="grid grid-cols-4 p-4 border-b bg-gray-50 text-sm font-medium">
          <div>Description</div>
          <div>Qty</div>
          <div>Price</div>
          <div className="text-right">Total</div>
        </div>

        {quote.lines.length === 0 && (
          <div className="p-6 text-gray-500 text-center">
            No items yet. Click "Add Line" to start building the quote.
          </div>
        )}

        {quote.lines.map((line) => (
          <div
            key={line.id}
            className="grid grid-cols-4 p-4 border-b"
          >
            <div>{line.description}</div>

            <div>{line.quantity}</div>

            <div>${line.price}</div>

            <div className="text-right">
              ${(line.quantity * line.price).toFixed(2)}
            </div>
          </div>
        ))}

      </div>

      {/* TOTAL */}

      <div className="flex justify-end text-lg font-semibold">
        Quote Total: ${total.toFixed(2)}
      </div>

    </div>
  );
}