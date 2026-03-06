import { prisma } from "@/lib/prisma";

export default async function ItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const item = await prisma.item.findUnique({
    where: { id },
    include: {
      customerPrices: {
        include: {
          customer: true,
        },
      },
    },
  });

  if (!item) return <div>Item not found</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold">{item.itemNumber}</h1>
          <p className="text-gray-500">{item.manufacturer}</p>
        </div>

        <button className="px-4 py-2 bg-black text-white rounded-lg">
          Edit Item
        </button>
      </div>

      {/* ITEM INFO */}
      <div className="grid grid-cols-3 gap-6">

        <div className="border rounded-xl p-4">
          <p className="text-xs text-gray-500">Category</p>
          <p className="font-medium">{item.category ?? "-"}</p>
        </div>

        <div className="border rounded-xl p-4">
          <p className="text-xs text-gray-500">Type</p>
          <p className="font-medium">{item.type}</p>
        </div>

        <div className="border rounded-xl p-4">
          <p className="text-xs text-gray-500">Status</p>
          <p className="font-medium">
            {item.active ? "Active" : "Inactive"}
          </p>
        </div>

      </div>

      {/* PRICING */}
      <div className="border rounded-xl p-6 space-y-4">

        <h2 className="font-semibold text-lg">Pricing</h2>

        <div className="grid grid-cols-3 gap-6">

          <div>
            <p className="text-xs text-gray-500">Cost</p>
            <p className="text-lg font-medium">
              ${item.cost?.toFixed(2) ?? "-"}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500">Base Price</p>
            <p className="text-lg font-medium">
              ${item.price?.toFixed(2) ?? "-"}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500">Last Sold Price</p>
            <p className="text-lg font-medium">
              ${item.lastSoldPrice?.toFixed(2) ?? "-"}
            </p>
          </div>

        </div>

      </div>

      {/* CUSTOMER PRICING */}
      <div className="border rounded-xl p-6">

        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-lg">
            Customer Pricing (MPV)
          </h2>

          <button className="px-3 py-1 bg-black text-white rounded">
            Add Price
          </button>
        </div>

        <table className="w-full text-sm">

          <thead className="text-left text-gray-500 border-b">
            <tr>
              <th className="py-2">Customer</th>
              <th>Price</th>
              <th>Created</th>
            </tr>
          </thead>

          <tbody>

            {item.customerPrices.map((p) => (
              <tr key={p.id} className="border-b">

                <td className="py-3">
                  {p.customer.name}
                </td>

                <td>
                  ${p.price.toFixed(2)}
                </td>

                <td>
                  {new Date(p.createdAt).toLocaleDateString()}
                </td>

              </tr>
            ))}

          </tbody>

        </table>

      </div>

      {/* ITEM STATUS */}
      <div className="border rounded-xl p-6 grid grid-cols-3 gap-6">

        <div>
          <p className="text-xs text-gray-500">Approved</p>
          <p className="font-medium">
            {item.approved ? "Yes" : "No"}
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-500">EOL Date</p>
          <p className="font-medium">
            {item.eolDate
              ? new Date(item.eolDate).toLocaleDateString()
              : "-"}
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-500">Created</p>
          <p className="font-medium">
            {new Date(item.createdAt).toLocaleDateString()}
          </p>
        </div>

      </div>

    </div>
  );
}