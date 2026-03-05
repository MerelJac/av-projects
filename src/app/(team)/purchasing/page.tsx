import { prisma } from "@/lib/prisma";

export default async function PurchasingPage() {

  const pos = await prisma.purchaseOrder.findMany({
    include: { project: true },
  });

  return (
    <div>

      <h1 className="text-2xl font-semibold mb-6">
        Purchase Orders
      </h1>

      <table className="w-full bg-white border rounded-xl">

        <thead className="bg-gray-100">
          <tr>
            <th className="p-3">Vendor</th>
            <th className="p-3">Project</th>
            <th className="p-3">Status</th>
          </tr>
        </thead>

        <tbody>
          {pos.map((po) => (
            <tr key={po.id} className="border-t">

              <td className="p-3">{po.vendor}</td>

              <td className="p-3">
                {po.project?.name}
              </td>

              <td className="p-3">{po.status}</td>

            </tr>
          ))}
        </tbody>

      </table>

    </div>
  );
}