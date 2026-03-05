"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function createCustomer(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string | null;
  const phone = formData.get("phone") as string | null;
  const billingTerm = formData.get("billingTerms") as string | null;

  if (!name) {
    throw new Error("Customer name required");
  }

  const customer = await prisma.customer.create({
    data: {
      name,
      email,
      phone,
      billingTerm,
    },
  });

  redirect(`/customers/${customer.id}`);
}