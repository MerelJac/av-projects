export type Item = {
  id: string;
  itemNumber: string;
  manufacturer: string | null;
  description?: string | null; // add to Item model if not present
  price: number | null;
  cost: number | null;
  category: string | null;
  type: string;
  preferredVendor?: { name: string } | null;
};

export const ITEM_TYPES = ["HARDWARE", "SOFTWARE", "SUBSCRIPTION", "INTERNAL_SERVICE", "EXTERNAL_SERVICE"] as const;