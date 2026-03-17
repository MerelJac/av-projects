import { QuoteStatus, ItemType} from "@prisma/client";
import { Item } from "./item";
import { Quote } from "./quote";

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

export type BOMLine = {
  id: string;
  itemId: string;
  item: Item;
  quantity: number;
  notes: string | null; // used as description/note per row
  costEach?: number | null; // override cost
  sellEach?: number | null; // override sell/price
  sortOrder?: number;
  section?: string; // grouping label e.g. "Crestron", "Call One"
  marginPct?: number | null;
};

export type BOM = {
  id: string;
  name: string;
  projectId: string;
  project: { id: string; name: string; customer: { name: string } };
  lines: BOMLine[];
  quotes: Quote[];
};

