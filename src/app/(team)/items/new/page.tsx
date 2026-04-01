// src/app/(team)/items/new/page.tsx
import { prisma } from "@/lib/prisma";
import NewItemForm from "./NewItemForm";

export default async function NewItemPage() {
  const units = await prisma.itemDropdownOption.findMany({
    where: { field: "unit" },
    orderBy: { value: "asc" },
    select: { value: true },
  });

  return <NewItemForm units={units.map((u) => u.value)} />;
}
