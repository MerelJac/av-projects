import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function ItemsPage() {
  const items = await prisma.item.findMany();

  return (
    <div>
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-semibold">Items</h1>

        <Link
          href="/items/new"
          className="bg-black text-white px-4 py-2 rounded-lg"
        >
          Add Item
        </Link>
      </div>

      <table className="w-full bg-white border rounded-xl">
        <thead className="bg-gray-100 text-sm">
          <tr>
            <th className="p-3 text-left">Item #</th>
            <th className="p-3 text-left">Manufacturer</th>
            <th className="p-3 text-left">Price</th>
          </tr>
        </thead>

        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-t">
              <td className="p-3">{item.itemNumber}</td>
              <td className="p-3">{item.manufacturer}</td>
              <td className="p-3">${item.price}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}