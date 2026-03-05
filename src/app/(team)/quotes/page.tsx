import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function QuotesPage() {
  const quotes = await prisma.quote.findMany({
    include: {
      customer: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>

      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-semibold">Quotes</h1>

        <Link
          href="/quotes/new"
          className="bg-black text-white px-4 py-2 rounded-lg"
        >
          New Quote
        </Link>
      </div>

      <table className="w-full bg-white border rounded-xl">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-3 text-left">Customer</th>
            <th className="p-3 text-left">Status</th>
            <th className="p-3 text-left">Total</th>
          </tr>
        </thead>

        <tbody>
          {quotes.map((q) => (
            <tr key={q.id} className="border-t">
              <td className="p-3">
                <Link href={`/quotes/${q.id}`}>
                  {q.customer.name}
                </Link>
              </td>

              <td className="p-3">{q.status}</td>

              <td className="p-3">${q.total ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}