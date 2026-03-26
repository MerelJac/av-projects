import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import NotesPanel from "@/app/components/NotesPanel";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Delete } from "lucide-react";
import DeleteQuoteButton from "@/app/components/projects/DeleteQuoteButton";

export default async function QuoteViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id;

  const quote = await prisma.quote.findUnique({
    where: { id },
    include: {
      customer: true,
      project: true,
      lines: {
        where: { bundleId: null }, // only unbundled lines
        include: { item: true },
      },
      quoteBundles: {
        where: { showToCustomer: true },
        include: {
          lines: { include: { item: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!quote) return notFound();

  // Unbundled lines shown individually
  const unbundledLines = quote.lines.map((l) => ({
    description: l.description,
    itemNumber: l.item?.itemNumber ?? null,
    quantity: l.quantity,
    price: l.price,
  }));

  // Bundled lines collapsed to one row per bundle
  const bundleRows = quote.quoteBundles.map((bundle) => ({
    description: bundle.name,
    itemNumber: null,
    quantity: 1,
    price: bundle.lines.reduce((sum, l) => sum + l.price * l.quantity, 0),
  }));

  const allLines = [...unbundledLines, ...bundleRows];
  const total = allLines.reduce((sum, l) => sum + l.quantity * l.price, 0);

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-xs text-[#999] mb-1">
            {quote.customer.name}
            {quote.project && <span> · {quote.project.name}</span>}
          </p>
          <h1 className="text-2xl font-bold text-[#111] font-mono tracking-tight">
            #{quote.id.slice(0, 8).toUpperCase()}
          </h1>
          <p className="text-xs text-[#999] mt-1">
            {new Date(quote.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              quote.status === "ACCEPTED"
                ? "bg-green-100 text-green-700"
                : quote.status === "SENT"
                  ? "bg-blue-100 text-blue-700"
                  : quote.status === "REJECTED"
                    ? "bg-red-100 text-red-600"
                    : "bg-gray-100 text-gray-600"
            }`}
          >
            {quote.status}
          </span>
          <Link
            href={`/projects/${quote.projectId}/quotes/${quote.id}`}
            className="text-sm font-semibold bg-[#111] text-white px-4 py-2 rounded-xl hover:bg-[#333] transition-colors"
          >
            Edit Quote
          </Link>
        </div>
      </div>

      {/* Lines */}
      <div className="bg-white border border-[#E5E3DE] rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#F0EEE9]">
              <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-[#999] px-5 py-3">
                Description
              </th>
              <th className="text-right text-[10px] font-semibold uppercase tracking-widest text-[#999] px-3 py-3 w-20">
                Qty
              </th>
              <th className="text-right text-[10px] font-semibold uppercase tracking-widest text-[#999] px-3 py-3 w-28">
                Unit Price
              </th>
              <th className="text-right text-[10px] font-semibold uppercase tracking-widest text-[#999] px-5 py-3 w-28">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {allLines.map((line, i) => (
              <tr key={i} className="border-b border-[#F7F6F3] last:border-0">
                <td className="px-5 py-3">
                  <p className="text-sm text-[#111]">{line.description}</p>
                  {line.itemNumber && (
                    <p className="text-[10px] text-[#bbb] font-mono mt-0.5">
                      {line.itemNumber}
                    </p>
                  )}
                </td>
                <td className="px-3 py-3 text-right text-sm text-[#666]">
                  {line.quantity}
                </td>
                <td className="px-3 py-3 text-right text-sm text-[#666]">
                  ${line.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td className="px-5 py-3 text-right text-sm font-semibold text-[#111]">
                  ${(line.quantity * line.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Total */}
      <div className="flex justify-end mt-4">
        <div className="bg-white border border-[#E5E3DE] rounded-2xl px-6 py-4 min-w-[200px]">
          <div className="flex justify-between items-center gap-8">
            <span className="text-sm text-[#666]">Total</span>
            <span className="text-lg font-bold text-[#111]">
              ${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Internal Notes */}
      <div className="mt-6">
        <NotesPanel documentType="QUOTE" documentId={quote.id} currentUserId={currentUserId} />
      </div>
      <DeleteQuoteButton id={quote.id}/>
    </div>
  );
}