import { prisma } from "@/lib/prisma";

export default async function ProjectPage({
  params,
}: {
  params: { id: string };
}) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      customer: true,
      shipments: true,
      timeEntries: true,
      purchaseOrders: true,
      milestones: true,
    },
  });

  if (!project) return <div>Project not found</div>;

  return (
    <div>
      <h1 className="text-2xl font-semibold">{project.name}</h1>

      <p className="text-gray-500 mb-6">Customer: {project.customer.name}</p>

      <div className="bg-white border rounded-xl p-6">
        <h3 className="font-semibold mb-4">Milestones</h3>

        {project.milestones.map((m) => (
          <div key={m.id} className="border-b py-2">
            {m.name}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="border p-6 rounded-xl">
          Shipments: {project.shipments.length}
        </div>

        <div className="border p-6 rounded-xl">
          Hours Logged: {project.timeEntries.length}
        </div>

        <div className="border p-6 rounded-xl">
          Purchase Orders: {project.purchaseOrders.length}
        </div>
      </div>
    </div>
  );
}
