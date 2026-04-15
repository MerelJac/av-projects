"use client";

import { useState, useRef } from "react";
import { Pencil } from "lucide-react";

export default function BomNameEditor({
  projectId,
  bomId,
  initialName,
}: {
  projectId: string;
  bomId: string;
  initialName: string;
}) {
  const [name, setName] = useState(initialName);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(initialName);
  const inputRef = useRef<HTMLInputElement>(null);

  function startEditing(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDraft(name);
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  }

  async function commit() {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === name) {
      setEditing(false);
      return;
    }
    const res = await fetch(`/api/projects/${projectId}/boms/${bomId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    });
    if (res.ok) setName(trimmed);
    setEditing(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") commit();
    if (e.key === "Escape") setEditing(false);
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={onKeyDown}
        onClick={(e) => e.preventDefault()}
        className="text-sm font-medium text-[#111] bg-transparent border-b border-[#111] outline-none w-full"
        autoFocus
      />
    );
  }

  return (
    <span className="flex items-center gap-1.5 group/name">
      <span className="text-sm font-medium text-[#111]">{name}</span>
      <button
        onClick={startEditing}
        className="opacity-0 group-hover/name:opacity-100 transition-opacity text-[#bbb] hover:text-[#111]"
        aria-label="Rename BOM"
      >
        <Pencil size={11} />
      </button>
    </span>
  );
}
