import { prisma } from "@/lib/prisma";
import { createQuote } from "../action";

export default async function NewQuotePage() {
  const customers = await prisma.customer.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div>

      <h1 className="text-2xl font-semibold mb-6">
        Create Quote
      </h1>

      <form
        action={createQuote}
        className="bg-white border rounded-xl p-6 flex flex-col gap-4 max-w-lg"
      >

        <select
          name="customerId"
          className="border p-2 rounded"
          required
        >
          <option value="">Select Customer</option>

          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <button className="bg-black text-white p-2 rounded">
          Create Quote
        </button>

      </form>

    </div>
  );
}