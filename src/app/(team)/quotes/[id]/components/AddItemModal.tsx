"use client";

import { useState } from "react";

export default function AddItemModal({
  items,
  onAdd,
}: {
  items: any[];
  onAdd: (itemId: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-black text-white px-4 py-2 rounded"
      >
        Add Item
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center">

          <div className="bg-white p-6 rounded-xl w-[500px]">

            <h2 className="text-lg font-semibold mb-4">
              Add Inventory Item
            </h2>

            <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto">

              {items.map((item) => (
                <button
                  key={item.id}
                  className="border p-2 text-left hover:bg-gray-50"
                  onClick={() => {
                    onAdd(item.id);
                    setOpen(false);
                  }}
                >
                  {item.itemNumber} — ${item.price}
                </button>
              ))}

            </div>

          </div>

        </div>
      )}
    </>
  );
}