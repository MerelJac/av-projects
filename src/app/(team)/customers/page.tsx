import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function CustomersPage() {
  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-semibold">Customers</h1>

        <Link
          href="/customers/new"
          className="bg-black text-white px-4 py-2 rounded-lg"
        >
          New Customer
        </Link>
      </div>

      <table className="w-full bg-white border rounded-xl overflow-hidden">
        <thead className="bg-gray-100 text-sm">
          <tr>
            <th className="p-3 text-left">Name</th>
            <th className="p-3 text-left">Email</th>
            <th className="p-3 text-left">Phone</th>
          </tr>
        </thead>

        <tbody>
          {customers.map((customer) => (
            <tr key={customer.id} className="border-t">
              <td className="p-3">
                <Link
                  href={`/customers/${customer.id}`}
                  className="hover:underline"
                >
                  {customer.name}
                </Link>
              </td>

              <td className="p-3">{customer.email}</td>

              <td className="p-3">{customer.phone}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}