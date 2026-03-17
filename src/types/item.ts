export type Item = {
  id: string;
  itemNumber: string;
  manufacturer: string | null;
  description?: string | null; // add to Item model if not present
  price: number | null;
  cost: number | null;
  category: string | null;
  type: string;
};
