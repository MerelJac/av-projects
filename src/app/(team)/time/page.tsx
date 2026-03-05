import { prisma } from "@/lib/prisma";

export default async function TimePage() {
  const entries = await prisma.timeEntry.findMany({
    include: {
      project: true,
      user: true,
    },
  });

  return (
    <div>

      <h1 className="text-2xl font-semibold mb-6">
        Time Tracking
      </h1>

      <table className="w-full bg-white border rounded-xl">

        <thead className="bg-gray-100">
          <tr>
            <th className="p-3">Project</th>
            <th className="p-3">User</th>
            <th className="p-3">Hours</th>
          </tr>
        </thead>

        <tbody>
          {entries.map((e) => (
            <tr key={e.id} className="border-t">
              <td className="p-3">{e.project.name}</td>

              <td className="p-3">{e.user.email}</td>

              <td className="p-3">{e.hours}</td>
            </tr>
          ))}
        </tbody>

      </table>

    </div>
  );
}