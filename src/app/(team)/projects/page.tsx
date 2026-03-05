import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function ProjectsPage() {
  const projects = await prisma.project.findMany({
    include: {
      customer: true,
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Projects</h1>

        <Link
          href="/projects/new"
          className="bg-black text-white px-4 py-2 rounded-lg"
        >
          + New Project
        </Link>
      </div>

      <table className="w-full bg-white border rounded-xl overflow-hidden">
        <thead className="bg-gray-100 text-sm">
          <tr>
            <th className="p-3 text-left">Project</th>
            <th className="p-3 text-left">Customer</th>
            <th className="p-3 text-left">Budget</th>
          </tr>
        </thead>

        <tbody>
          {projects.map((project) => (
            <tr key={project.id} className="border-t">
              <td className="p-3">
                <Link href={`/projects/${project.id}`}>{project.name}</Link>
              </td>

              <td className="p-3">{project.customer.name}</td>

              <td className="p-3">${project.totalBudget}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
