import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import QuoteEditor from "../../bom/QuoteEditor";
import { Prisma } from "@prisma/client";

export type QuoteWithDetails = Prisma.QuoteGetPayload<{
  include: {
    customer: true;
    project: true;
    billOfMaterials: { select: { id: true; name: true } };
    lines: { include: { item: true; bundle: true } };
    quoteBundles: { include: { lines: { include: { item: true } } } };
  };
}>;

export default async function QuotePage({
  params,
}: {
  params: Promise<{ id: string; quoteId: string }>;
}) {
  const { id, quoteId } = await params;

  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: {
      customer: true,
      project: true,
      billOfMaterials: { select: { id: true, name: true } },
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

  if (!quote || quote.projectId !== id) return notFound();

  return <QuoteEditor quote={quote} projectId={id} />;
}