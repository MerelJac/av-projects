// src/app/(team)/projects/[id]/page.tsx
import { prisma } from "@/lib/prisma";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      customer: true,
      shipments: true,
      timeEntries: true,
      purchaseOrders: true,
      milestones: true,
      quotes: {
        include: {
          lines: {
            include: {
              item: true,
              bundle: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      changeOrders: {
        orderBy: { createdAt: "desc" },
      },
      boms: {
        include: {
          lines: {
            include: { item: true },
          },
          quotes: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!project) return <div>Project not found</div>;

  const quoteStatusStyles: Record<string, string> = {
    ACCEPTED: "bg-green-100 text-green-700",
    SENT: "bg-blue-100 text-blue-700",
    REJECTED: "bg-red-100 text-red-700",
    DRAFT: "bg-gray-100 text-gray-600",
  };

  const changeOrderTotal = project.changeOrders.reduce(
    (sum, co) => sum + co.amount,
    0,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{project.name}</h1>
        <p className="text-gray-500">Customer: {project.customer.name}</p>
      </div>

      {/* Quotes */}
      <div className="bg-white border rounded-xl p-6">
        <h3 className="font-semibold mb-4">Quotes ({project.quotes.length})</h3>

        {project.quotes.length === 0 ? (
          <p className="text-sm text-gray-400">No quotes linked yet.</p>
        ) : (
          <div className="space-y-4">
            {project.quotes.map((quote) => (
              <div key={quote.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700">
                      #{quote.id.slice(0, 8).toUpperCase()}
                    </span>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        quoteStatusStyles[quote.status]
                      }`}
                    >
                      {quote.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(quote.createdAt).toLocaleDateString()}
                    {quote.total != null && (
                      <span className="ml-3 font-semibold text-gray-800">
                        ${quote.total.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                {quote.lines.length > 0 && (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-400 border-b text-xs uppercase tracking-wide">
                        <th className="pb-2">Description</th>
                        <th className="pb-2">Item</th>
                        <th className="pb-2 text-right">Qty</th>
                        <th className="pb-2 text-right">Price</th>
                        <th className="pb-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quote.lines.map((line) => (
                        <tr key={line.id} className="border-b last:border-0">
                          <td className="py-1.5">{line.description}</td>
                          <td className="py-1.5 text-gray-400">
                            {line.item?.itemNumber ?? "—"}
                          </td>
                          <td className="py-1.5 text-right">{line.quantity}</td>
                          <td className="py-1.5 text-right">
                            ${line.price.toLocaleString()}
                          </td>
                          <td className="py-1.5 text-right">
                            ${(line.quantity * line.price).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* BOMs */}
      <div className="bg-white border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">
            Bill of Materials ({project.boms.length})
          </h3>
          <a
            href={`/projects/${project.id}/bom/new`}
            className="text-sm bg-black text-white px-3 py-1.5 rounded-lg"
          >
            + New BOM
          </a>
        </div>
        {project.boms.length === 0 ? (
          <p className="text-sm text-gray-400">No BOMs yet.</p>
        ) : (
          <div className="space-y-3">
            {project.boms.map((bom) => (
              <div
                key={bom.id}
                className="border rounded-lg p-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-sm">{bom.name}</p>
                  <p className="text-xs text-gray-400">
                    {bom.lines.length} items ·{" "}
                    {bom.quotes.length > 0
                      ? `${bom.quotes.length} quote(s) generated`
                      : "No quotes yet"}
                  </p>
                </div>
                <a
                  href={`/projects/${project.id}/bom/${bom.id}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  View →
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Change Orders */}
      <div className="bg-white border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">
            Change Orders ({project.changeOrders.length})
          </h3>
          {project.changeOrders.length > 0 && (
            <span className="text-sm font-medium text-gray-600">
              Total:{" "}
              <span
                className={
                  changeOrderTotal >= 0 ? "text-green-600" : "text-red-600"
                }
              >
                {changeOrderTotal >= 0 ? "+" : ""}$
                {changeOrderTotal.toLocaleString()}
              </span>
            </span>
          )}
        </div>

        {project.changeOrders.length === 0 ? (
          <p className="text-sm text-gray-400">No change orders yet.</p>
        ) : (
          <div className="divide-y">
            {project.changeOrders.map((co) => (
              <div
                key={co.id}
                className="py-3 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {co.description}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(co.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`text-sm font-semibold ${
                    co.amount >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {co.amount >= 0 ? "+" : ""}${co.amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Milestones */}
      <div className="bg-white border rounded-xl p-6">
        <h3 className="font-semibold mb-4">Milestones</h3>
        {project.milestones.map((m) => (
          <div key={m.id} className="border-b py-2">
            {m.name}
          </div>
        ))}
      </div>

      {/* Stats */}
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
