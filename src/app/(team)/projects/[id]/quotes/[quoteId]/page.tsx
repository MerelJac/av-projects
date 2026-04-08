import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ProposalEditor from "./ProposalEditor";

import NotesPanel from "@/app/components/NotesPanel";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import DeleteQuoteButton from "@/app/components/projects/DeleteQuoteButton";


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
      boms: {
        include: {
          bom: {
            select: { id: true, name: true },
          },
        },
      },
      lines: {
        include: { item: { include: { preferredVendor: { select: { name: true } } } }, bundle: true },
        orderBy: { id: "asc" },
      },
      quoteBundles: {
        include: { lines: { include: { item: { include: { preferredVendor: { select: { name: true } } } } } } },
        orderBy: { createdAt: "asc" },
      },
      salesOrder: { select: { id: true } },
    },
  });

  if (!quote || quote.projectId !== id) return notFound();

  return (
    <div className="bg-[#F7F6F3]">
      <ProposalEditor quote={quote} projectId={id} />
      <div className="max-w-5xl mx-auto px-6 pb-10">
        <NotesPanel
          documentType="QUOTE"
          documentId={quote.id}
          currentUserId={currentUserId}
        />
      </div>
      <DeleteQuoteButton id={quoteId} />
    </div>
  );
}
