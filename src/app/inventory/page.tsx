import { prisma } from "@/lib/prisma"

export default async function InventoryPage() {
  const items = await prisma.item.findMany()

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Inventory</h1>

      <table className="w-full text-sm">
        <thead>
          <tr>
            <th>Item</th>
            <th>Manufacturer</th>
            <th>Price</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>{item.itemNumber}</td>
              <td>{item.manufacturer}</td>
              <td>${item.price}</td>
              <td>{item.active ? "Active" : "Inactive"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}