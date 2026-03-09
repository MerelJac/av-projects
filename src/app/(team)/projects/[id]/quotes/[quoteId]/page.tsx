import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import QuoteEditor from "../../bom/QuoteEditor";

export default async function QuotePage({
  params,
}: {
  params: { id: string; quoteId: string };
}) {
  const quote = await prisma.quote.findUnique({
    where: { id: params.quoteId },
    include: {
      customer: true,
      project: true,
      bom: { select: { id: true, name: true } },
      lines: {
        include: { item: true, bundle: true },
        orderBy: { id: "asc" },
      },
      quoteBundles: {
        include: { lines: { include: { item: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!quote || quote.projectId !== params.id) return notFound();

  return <QuoteEditor quote={quote as any} projectId={params.id} />;
}
