"use client";

import { createLine } from "../dep-builder/actions";

export default function AddLine({
  quoteId,
  items,
  bundleId,
}: {
  quoteId: string;
  items: any[];
  bundleId?: string;
}) {
  return (
    <form action={createLine} className="flex gap-2">

      <input type="hidden" name="quoteId" value={quoteId} />

      {bundleId && (
        <input type="hidden" name="bundleId" value={bundleId} />
      )}

      <select name="itemId" className="border px-3 py-2 rounded">

        {items.map((item) => (
          <option key={item.id} value={item.id}>
            {item.itemNumber}
          </option>
        ))}

      </select>

      <button className="border px-4 py-2 rounded">
        Add Item
      </button>

    </form>
  );
}