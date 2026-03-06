"use client";

import { createBundle } from "../builder/actions";

export default function AddBundle({ quoteId }: { quoteId: string }) {
  return (
    <form action={createBundle} className="flex gap-2">

      <input
        type="hidden"
        name="quoteId"
        value={quoteId}
      />

      <input
        name="name"
        placeholder="Bundle name"
        className="border px-3 py-2 rounded"
        required
      />

      <button className="border px-4 py-2 rounded">
        Add Bundle
      </button>

    </form>
  );
}