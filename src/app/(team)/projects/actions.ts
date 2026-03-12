"use server";
// src/app/(team)/projects/actions.ts
import { prisma } from "@/lib/prisma";
import { BillingTerms } from "@prisma/client";
import { redirect } from "next/navigation";

export async function createProject(formData: FormData) {

  const name = formData.get("name") as string;
  const customerId = formData.get("customerId") as string;
  const quoteId = formData.get("quoteId") as string | null;
  const billingTerms = formData.get("billingTerms") as BillingTerms;

  const project = await prisma.project.create({
    data: {
      name,
      customerId,
      quoteId: quoteId || null,
      billingTerms,
    },
  });

  redirect(`/projects/${project.id}`);
}

export async function updateProjectBillingTerms(formData: FormData) {
  const projectId = formData.get("projectId") as string;
  const billingTerms = formData.get("billingTerms") as BillingTerms | null;

  await prisma.project.update({
    where: { id: projectId },
    data: { billingTerms: billingTerms || null },
  });

}
export async function generateQuoteFromBOM(bomId: string, projectId: string) {
  const bom = await prisma.billOfMaterials.findUnique({
    where: { id: bomId },
    include: {
      lines: { include: { item: true } },
      project: true,
    },
  });

  if (!bom) throw new Error("BOM not found");

  const quote = await prisma.quote.create({
    data: {
      customerId: bom.project.customerId,
      projectId,
      bomId,          // reference back to source BOM
      status: "DRAFT",
      lines: {
        create: bom.lines.map((line) => ({
          itemId: line.itemId,
          description: line.item.itemNumber, // team can edit after
          quantity: line.quantity,
          price: line.item.price ?? 0,       // snapshot price at this moment
          cost: line.item.cost ?? null,       // snapshot cost too
        })),
      },
    },
  });

  return quote.id;
}