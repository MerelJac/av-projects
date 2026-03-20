"use server";
// app/vendors/actions.ts
import { prisma } from "@/lib/prisma";

export async function createVendor(data: {
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
}) {
  if (!data.name?.trim()) return { error: "Name is required" };
  try {
    await prisma.vendor.create({ data });
    return { success: true };
  } catch {
    return { error: "Failed to create vendor" };
  }
}