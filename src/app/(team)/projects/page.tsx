import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ArrowRight, Plus } from "lucide-react";

export default async function ProjectsPage() {
  const projects = await prisma.project.findMany({
    include: {
      customer: true,
      quotes: {
        select: { id: true, status: true, isDirect: true, isChangeOrder: true },
      },
      boms: { select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="bg-[#F7F6F3]">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-[#111] tracking-tight">
            Projects
          </h1>
          <Link
            href="/projects/new"
            className="flex items-center gap-1.5 text-sm font-semibold bg-[#111] text-white px-4 py-2 rounded-xl hover:bg-[#333] transition-colors"
          >
            <Plus size={14} />
            New Project
          </Link>
        </div>

        <div className="bg-white border border-[#E5E3DE] rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#F0EEE9]">
                <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-[#999] px-5 py-3">
                  Project
                </th>
                <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-[#999] px-3 py-3">
                  Customer
                </th>
                <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-[#999] px-3 py-3">
                  Billing
                </th>
                <th className="text-right text-[10px] font-semibold uppercase tracking-widest text-[#999] px-3 py-3">
                  BOMs
                </th>
                <th className="text-right text-[10px] font-semibold uppercase tracking-widest text-[#999] px-3 py-3">
                  Documents
                </th>
                <th className="text-right text-[10px] font-semibold uppercase tracking-widest text-[#999] px-5 py-3">
                  Budget
                </th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {projects.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-sm text-[#bbb]"
                  >
                    No projects yet
                  </td>
                </tr>
              ) : (
                projects.map((project) => {
                  const proposals = project.quotes.filter(
                    (q) => !q.isDirect && !q.isChangeOrder,
                  ).length;

                  const salesOrders = project.quotes.filter(
                    (q) => q.isDirect && !q.isChangeOrder,
                  ).length;

                  const changeOrders = project.quotes.filter(
                    (q) => !q.isDirect && q.isChangeOrder,
                  ).length;

                  const acceptedProposals = proposals
                    ? project.quotes.filter(
                        (q) =>
                          !q.isDirect &&
                          !q.isChangeOrder &&
                          q.status === "ACCEPTED",
                      ).length
                    : 0;

                  const acceptedSalesOrders = salesOrders
                    ? project.quotes.filter(
                        (q) =>
                          q.isDirect &&
                          !q.isChangeOrder &&
                          q.status === "ACCEPTED",
                      ).length
                    : 0;

                  const acceptedChangeOrders = changeOrders
                    ? project.quotes.filter(
                        (q) =>
                          !q.isDirect &&
                          q.isChangeOrder &&
                          q.status === "ACCEPTED",
                      ).length
                    : 0;

                  return (
                    <tr
                      key={project.id}
                      className="border-b border-[#F7F6F3] last:border-0 hover:bg-[#FAFAF9] transition-colors group"
                    >
                      <td className="px-5 py-3.5">
                        <Link
                          href={`/projects/${project.id}`}
                          className="text-sm font-semibold text-[#111] hover:underline"
                        >
                          {project.name}
                        </Link>
                        <p className="text-xs text-[#999] mt-0.5">
                          {new Date(project.createdAt).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="px-3 py-3.5 text-sm text-[#666]">
                        {project.customer.name}
                      </td>
                      <td className="px-3 py-3.5">
                        {project.billingTerms ? (
                          <span className="text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 bg-[#F0EEE9] text-[#666] rounded-md">
                            {project.billingTerms}
                          </span>
                        ) : (
                          <span className="text-[#ccc] text-sm">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3.5 text-right text-sm text-[#666]">
                        {project.boms.length > 0 ? (
                          project.boms.length
                        ) : (
                          <span className="text-[#ccc]">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3.5 text-right">
                        {project.quotes.length > 0 ? (
                          <div className="flex flex-col items-end gap-1.5">
                            <div className="flex flex-col items-center gap-1.5">
                              {[
                                {
                                  count: proposals,
                                  accepted: acceptedProposals,
                                  label: "Proposal",
                                },
                                {
                                  count: salesOrders,
                                  accepted: acceptedSalesOrders,
                                  label: "Sales Order",
                                },
                                {
                                  count: changeOrders,
                                  accepted: acceptedChangeOrders,
                                  label: "Change Order",
                                },
                              ].map(({ count, accepted, label }) => (
                                <span
                                  key={label}
                                  className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                                    accepted > 0
                                      ? "bg-green-50 text-green-700"
                                      : "bg-[#F0EEE9] text-[#666]"
                                  }`}
                                >
                                  {count} {label}
                                  {count !== 1 && "s"}
                                  {accepted > 0 && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                                  )}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[#ccc] text-sm">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right text-sm font-semibold text-[#111]">
                        {project.totalBudget != null ? (
                          `$${project.totalBudget.toLocaleString()}`
                        ) : (
                          <span className="text-[#ccc] font-normal">—</span>
                        )}
                      </td>
                      <td className="pr-4">
                        <Link
                          href={`/projects/${project.id}`}
                          className="text-sm font-semibold text-[#111] hover:underline"
                        >
                          <ArrowRight
                            size={14}
                            className="text-[#ccc] group-hover:text-[#111] transition-colors"
                          />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
