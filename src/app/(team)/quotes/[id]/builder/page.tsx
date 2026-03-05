import { prisma } from "@/lib/prisma";

export default async function QuoteBuilder({ params }) {

  const quote = await prisma.quote.findUnique({
    where: { id: params.id },
    include: {
      bundles: {
        include: {
          lines: true
        }
      },
      lines: true,
      customer: true
    }
  });

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}

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

      {/* Bundles */}

      {quote.bundles.map((bundle) => (

        <div
          key={bundle.id}
          className="border rounded-xl bg-white"
        >

          {/* Bundle Header */}

          <div className="flex justify-between p-4 border-b">

            <h2 className="font-semibold">
              {bundle.name}
            </h2>

            <button className="text-sm text-gray-500">
              + Add Item
            </button>

          </div>

          {/* Lines */}

          <div>

            {bundle.lines.map((line) => (

              <div
                key={line.id}
                className="grid grid-cols-4 p-4 border-b"
              >

                <div>{line.description}</div>

                <div>Qty {line.quantity}</div>

                <div>${line.price}</div>

                <div className="text-right">

                  ${(line.quantity * line.price).toFixed(2)}

                </div>

              </div>

            ))}

          </div>

        </div>

      ))}

      {/* Quote Total */}

      <div className="flex justify-end">

        <div className="text-lg font-semibold">

          Quote Total: $
          {quote.bundles
            .flatMap(b => b.lines)
            .reduce(
              (sum, l) => sum + (l.price * l.quantity),
              0
            )
          }

        </div>

      </div>

    </div>
  );
}