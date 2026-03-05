import { prisma } from "@/lib/prisma";

export default async function ShipmentsPage() {
  const shipments = await prisma.shipment.findMany({
    include: {
      project: true,
      item: true,
    },
  });

  return (
    <div>

      <h1 className="text-2xl font-semibold mb-6">
        Shipments
      </h1>

      <table className="w-full bg-white border rounded-xl">

        <thead className="bg-gray-100">
          <tr>
            <th className="p-3">Project</th>
            <th className="p-3">Item</th>
            <th className="p-3">Carrier</th>
            <th className="p-3">Tracking</th>
          </tr>
        </thead>

        <tbody>
          {shipments.map((s) => (
            <tr key={s.id} className="border-t">
              <td className="p-3">{s.project.name}</td>

              <td className="p-3">
                {s.item?.itemNumber}
              </td>

              <td className="p-3">{s.carrier}</td>

              <td className="p-3">{s.tracking}</td>
            </tr>
          ))}
        </tbody>

      </table>

    </div>
  );
}