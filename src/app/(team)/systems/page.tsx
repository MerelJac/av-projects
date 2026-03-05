import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function SystemsPage() {
  const systems = await prisma.systemTemplate.findMany();

  return (
    <div>

      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-semibold">
          System Templates
        </h1>

        <Link
          href="/systems/new"
          className="bg-black text-white px-4 py-2 rounded"
        >
          New System
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-6">

        {systems.map((system) => (
          <Link
            key={system.id}
            href={`/systems/${system.id}`}
            className="border p-6 rounded-xl bg-white"
          >
            {system.name}
          </Link>
        ))}

      </div>

    </div>
  );
}