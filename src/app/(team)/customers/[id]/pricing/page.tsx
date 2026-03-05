// src/app/(team)/customers/[id]/pricing/page.tsx

import { prisma } from "@/lib/prisma";

export default async function CustomerPricing({
  params,
}: {
  params: Promise<{ id: string }>;
}) {

  const { id } = await params;

  const customer = await prisma.customer.findUnique({
    where: { id },
  });

  const items = await prisma.item.findMany({
    include: {
      customerPrices: {
        where: { customerId: id },
      },
    },
    orderBy: { itemNumber: "asc" },
  });

  if (!customer) return <div>Customer not found</div>;

  return (
    <div className="flex flex-col gap-6 max-w-6xl">

      <div>
        <h1 className="text-2xl font-semibold">
          {customer.name} Pricing
        </h1>

        <p className="text-gray-500">
          Customer specific pricing (MPV)
        </p>
      </div>

      <div className="border rounded-xl bg-white overflow-hidden">

        <div className="grid grid-cols-7 bg-gray-50 p-3 text-sm font-medium">
          <div>Item No</div>
          <div>Manufacturer</div>
          <div>Cost</div>
          <div>Base Price</div>
          <div>Customer Price</div>
          <div>Margin</div>
          <div>Status</div>
        </div>

        {items.map((item) => {

          const customerPrice =
            item.customerPrices[0]?.price ?? item.price ?? 0;

          const margin =
            item.cost && customerPrice
              ? ((customerPrice - item.cost) / customerPrice) * 100
              : 0;

          return (
            <div
              key={item.id}
              className="grid grid-cols-7 p-3 border-t text-sm items-center"
            >

              <div>{item.itemNumber}</div>

              <div>{item.manufacturer}</div>

              <div>${item.cost}</div>

              <div>${item.price}</div>

              <div>

                <input
                  defaultValue={customerPrice}
                  className="border rounded px-2 py-1 w-24"
                />

              </div>

              <div>
                {margin.toFixed(1)}%
              </div>

              <div className="text-xs">

                {!item.active && (
                  <span className="text-red-500">Inactive</span>
                )}

                {item.eolDate && (
                  <span className="ml-2 text-yellow-600">
                    EOL
                  </span>
                )}

                {item.approved && (
                  <span className="ml-2 text-green-600">
                    Approved
                  </span>
                )}

              </div>

            </div>
          );
        })}

      </div>

    </div>
  );
}