"use server";
// src/app/(team)/projects/actions.ts
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function createProject(formData: FormData) {

  const name = formData.get("name") as string;
  const customerId = formData.get("customerId") as string;
  const quoteId = formData.get("quoteId") as string | null;
  const billingTerms = formData.get("billingTerms") as any;

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