"use server";
// src/app/(team)/projects/actions.ts
import { prisma } from "@/lib/prisma";
import { BillingTerms } from "@prisma/client";
import { redirect } from "next/navigation";

export async function createProject(formData: FormData) {

  const name = formData.get("name") as string;
  const customerId = formData.get("customerId") as string;
  const billingTerms = formData.get("billingTerms") as BillingTerms;

  const project = await prisma.project.create({
    data: {
      name,
      customerId,
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