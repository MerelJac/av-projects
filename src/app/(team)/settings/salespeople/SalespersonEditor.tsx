"use client";
import { useState } from "react";
import { Trash2, Plus } from "lucide-react";

type Option = { id: string; name: string };

async function addOption(
  field: "salesperson",
  value: string,
  setList: React.Dispatch<React.SetStateAction<Option[]>>,
  setInput: React.Dispatch<React.SetStateAction<string>>,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>,
) {
  if (!value.trim()) return;
  setLoading(true);
  const res = await fetch("/api/salespeople", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ field, value }),
  });
  if (res.ok) {
    const opt = await res.json();
    setList((prev) =>
      [...prev, opt].sort((a, b) => a.name.localeCompare(b.name)),
    );
    setInput("");
  }
  setLoading(false);
}

async function deleteOption(
  id: string,
  setList: React.Dispatch<React.SetStateAction<Option[]>>,
) {
  if (!confirm(`Are you sure you want to delete this salesperson? This cannot be undone.`)) return;
  const res = await fetch(`/api/salespeople/${id}`, { method: "DELETE" });
  if (res.ok) {
    setList((prev) => prev.filter((o) => o.id !== id));
  }
}

function OptionSection({
  title,
  field,
  options,
  setList,
  newValue,
  setNewValue,
  adding,
  setAdding,
}: {
  title: string;
  field: "salesperson";
  options: Option[];
  setList: React.Dispatch<React.SetStateAction<Option[]>>;
  newValue: string;
  setNewValue: React.Dispatch<React.SetStateAction<string>>;
  adding: boolean;
  setAdding: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  return (
    <div className="bg-white border border-[#E5E3DE] rounded-2xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[#F0EEE9] flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#111]">{title}</h3>
        <span className="text-xs text-[#bbb]">{options.length}</span>
      </div>

      {options.length === 0 ? (
        <p className="px-5 py-6 text-sm text-[#bbb] text-center">
          No options yet
        </p>
      ) : (
        <ul className="divide-y divide-[#F7F6F3]">
          {options.map((opt) => (
            <li
              key={opt.id}
              className="flex items-center justify-between px-5 py-3 group"
            >
              <span className="text-sm text-[#111]">{opt.name}</span>
              <button
                onClick={() => deleteOption(opt.id, setList)}
                className="opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-[#ccc] hover:text-red-500"
                title="Remove"
              >
                <Trash2 size={13} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="px-5 py-3.5 border-t border-[#F0EEE9] flex gap-2">
        <input
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter")
              addOption(field, newValue, setList, setNewValue, setAdding);
          }}
          placeholder={`Add ${title.toLowerCase()} option…`}
          className="flex-1 text-sm text-[#111] placeholder-[#bbb] bg-[#F7F6F3] rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-[#111]/10"
        />
        <button
          onClick={() =>
            addOption(field, newValue, setList, setNewValue, setAdding)
          }
          disabled={adding || !newValue.trim()}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#111] text-white hover:bg-[#333] disabled:opacity-40 transition-colors flex-shrink-0"
          title="Add"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}

export default function SalepersonEditor({
  salespeople,
}: {
  salespeople: Option[];
}) {
  const [salespeopleList, setSalespeopleList] = useState<Option[]>(salespeople);

  const [newSalesperson, setNewSalesperson] = useState("");
  const [addingSalesperson, setAddingSalesperson] = useState(false);

  return (
    <div className="space-y-6">
      <OptionSection
        title="Salespeople"
        field="salesperson"
        options={salespeopleList}
        setList={setSalespeopleList}
        newValue={newSalesperson}
        setNewValue={setNewSalesperson}
        adding={addingSalesperson}
        setAdding={setAddingSalesperson}
      />
    </div>
  );
}
