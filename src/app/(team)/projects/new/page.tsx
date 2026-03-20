import { prisma } from "@/lib/prisma";
import { createProject } from "../actions";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function NewProjectPage() {
  const customers = await prisma.customer.findMany({ orderBy: { name: "asc" } });
  const quotes = await prisma.quote.findMany({
    where: { projectId: null },
    include: { customer: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="bg-[#F7F6F3]">
      <div className="max-w-lg mx-auto px-6 py-10">

        <Link
          href="/projects"
          className="flex items-center gap-2 text-sm text-[#666] hover:text-[#111] mb-6 transition-colors"
        >
          <ArrowLeft size={15} />
          Projects
        </Link>

        <h1 className="text-2xl font-bold text-[#111] tracking-tight mb-8">
          New Project
        </h1>

        <form action={createProject} className="space-y-4">

          <div className="bg-white border border-[#E5E3DE] rounded-2xl p-6 space-y-4">

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-[#999]">
                Project Name
              </label>
              <input
                name="name"
                placeholder="e.g. Conference Room AV Install"
                required
                className="w-full text-sm text-[#111] border border-[#E5E3DE] rounded-xl px-3 py-2.5 placeholder:text-[#ccc] focus:outline-none focus:border-[#111] transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-[#999]">
                Customer
              </label>
              <select
                name="customerId"
                required
                className="w-full text-sm text-[#111] border border-[#E5E3DE] rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#111] transition-colors bg-white"
              >
                <option value="">Select a customer</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-[#999]">
                Billing Terms
              </label>
              <select
                name="billingTerms"
                className="w-full text-sm text-[#111] border border-[#E5E3DE] rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#111] transition-colors bg-white"
              >
                <option value="NET30">Net 30</option>
                <option value="PROGRESS">Progress Billing</option>
                <option value="PREPAID">Prepaid</option>
              </select>
            </div>

            {quotes.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-[#999]">
                  Link Quote{" "}
                  <span className="normal-case font-normal text-[#bbb] tracking-normal">
                    (optional)
                  </span>
                </label>
                <select
                  name="quoteId"
                  className="w-full text-sm text-[#111] border border-[#E5E3DE] rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#111] transition-colors bg-white"
                >
                  <option value="">No quote</option>
                  {quotes.map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.customer.name} — #{q.id.slice(0, 8).toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
            )}

          </div>

          <button
            type="submit"
            className="w-full text-sm font-semibold bg-[#111] text-white py-3 rounded-xl hover:bg-[#333] transition-colors"
          >
            Create Project
          </button>

        </form>
      </div>
    </div>
  );
}