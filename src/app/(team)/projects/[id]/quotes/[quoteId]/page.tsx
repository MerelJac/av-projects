import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import QuoteEditor from "./QuoteEditor";
import { Prisma } from "@prisma/client";
import NotesPanel from "@/app/components/NotesPanel";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

export type QuoteWithDetails = Prisma.QuoteGetPayload<{
  include: {
    customer: true;
    project: true;
    billOfMaterials: { select: { id: true; name: true } };
    lines: { include: { item: true; bundle: true } };
    quoteBundles: { include: { lines: { include: { item: true } } } };
    salesOrder: { select: { id: true } };  // ← add this
  };
}>;

export default async function QuotePage({
  params,
}: {
  params: Promise<{ id: string; quoteId: string }>;
}) {
  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id;
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
      salesOrder: { select: { id: true } },  // ← add this
    },
  });

  if (!quote || quote.projectId !== id) return notFound();

  return (
    <div className="bg-[#F7F6F3]">
      <QuoteEditor quote={quote} projectId={id} />
      <div className="max-w-5xl mx-auto px-6 pb-10">
        <NotesPanel
          documentType="QUOTE"
          documentId={quote.id}
          currentUserId={currentUserId}
        />
      </div>
    </div>
  );
}