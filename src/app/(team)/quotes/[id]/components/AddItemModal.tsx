"use client";

import { useState } from "react";

export default function AddItemModal({
  items,
  quoteId,
}: {
  items: any[];
  quoteId: string;
}) {
  const [open, setOpen] = useState(false);

  async function addItem(itemId: string) {
    await fetch("/api/proposals/add-item", {
      method: "POST",
      body: JSON.stringify({
        quoteId,
        itemId,
      }),
    });

    window.location.reload();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-black text-white px-4 py-2 rounded"
      >
        Add Item
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">

          <div className="bg-white p-6 rounded-xl w-[500px]">

            <h2 className="text-lg font-semibold mb-4">
              Add Item
            </h2>

            <div className="space-y-2 max-h-[300px] overflow-y-auto">

              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between border p-2 rounded"
                >
                  <div>
                    <p className="font-medium">{item.itemNumber}</p>
                    <p className="text-xs text-gray-500">
                      {item.manufacturer}
                    </p>
                  </div>

                  <button
                    onClick={() => addItem(item.id)}
                    className="text-sm bg-black text-white px-3 rounded"
                  >
                    Add
                  </button>
                </div>
              ))}

            </div>

          </div>

        </div>
      )}
    </>
  );
}