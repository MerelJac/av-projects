import { prisma } from "@/lib/prisma";

export default async function CustomerPage({
  params,
}: {
  params: { id: string };
}) {
  const customer = await prisma.customer.findUnique({
    where: { id: params.id },
    include: {
      projects: true,
      quotes: true,
    },
  });

  if (!customer) return <div>Customer not found</div>;

  return (
    <div>
      <h1 className="text-2xl font-semibold">{customer.name}</h1>

      <p className="text-gray-500 mb-6">
        {customer.email} • {customer.phone}
      </p>

      <div className="grid grid-cols-2 gap-6">

        <div className="bg-white border rounded-xl p-6">
          <h3 className="font-semibold mb-4">Projects</h3>

          {customer.projects.map((project) => (
            <div key={project.id} className="border-b py-2">
              {project.name}
            </div>
          ))}
        </div>

        <div className="bg-white border rounded-xl p-6">
          <h3 className="font-semibold mb-4">Quotes</h3>

          {customer.quotes.map((quote) => (
            <div key={quote.id} className="border-b py-2">
              {quote.status}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}