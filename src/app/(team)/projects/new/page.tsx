// src/app/(team)/projects/new/page.tsx
import { prisma } from "@/lib/prisma";
import { createProject } from "../actions";
export default async function NewProjectPage() {

  const customers = await prisma.customer.findMany();
  const quotes = await prisma.quote.findMany({
    include: { customer: true },
  });

  return (
    <div>

      <h1 className="text-2xl font-semibold mb-6">
        Create Project
      </h1>

      <form
        action={createProject}
        className="bg-white border rounded-xl p-6 flex flex-col gap-4 max-w-lg"
      >

        <input
          name="name"
          placeholder="Project Name"
          className="border p-2 rounded"
        />

        <select name="customerId" className="border p-2 rounded">

          <option>Select Customer</option>

          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}

        </select>

        <select name="quoteId" className="border p-2 rounded">

          <option value="">Optional Quote</option>

          {quotes.map((q) => (
            <option key={q.id} value={q.id}>
              {q.customer.name}
            </option>
          ))}

        </select>

        <select name="billingTerms" className="border p-2 rounded">

          <option value="NET30">Net 30</option>
          <option value="PROGRESS">Progress Billing</option>
          <option value="PREPAID">Prepaid</option>

        </select>

        <button className="bg-black text-white p-2 rounded">
          Create Project
        </button>

      </form>

    </div>
  );
}