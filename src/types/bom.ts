import { QuoteStatus, ItemType } from "@prisma/client";

export type BOMItem = {
  id: string;
  itemNumber: string;
  manufacturer: string | null;
  price: number | null;
  cost: number | null;
  category: string | null;
  type: ItemType;
};

export type BOMLineType = {
  id: string;
  itemId: string;
  item: BOMItem;
  quantity: number;
  notes: string | null;
    sortOrder?: number; // ← match
};

export type BOMType = {
  id: string;
  name: string;
  projectId: string;
  project: { id: string; name: string; customer: { name: string } };
  lines: BOMLineType[];
  quotes: { id: string; status: QuoteStatus; total: number | null; createdAt: Date }[];
};