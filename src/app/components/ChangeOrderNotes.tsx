"use client";
import { useState } from "react";
import { StickyNote } from "lucide-react";
import NotesPanel from "./NotesPanel";

export default function ChangeOrderNotes({
  changeOrderId,
  currentUserId,
}: {
  changeOrderId: string;
  currentUserId?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-[10px] text-[#999] hover:text-[#111] transition-colors mt-1"
        title="Toggle notes"
      >
        <StickyNote size={11} />
        {open ? "Hide notes" : "Notes"}
      </button>
      {open && (
        <div className="mt-3">
          <NotesPanel documentType="CHANGE_ORDER" documentId={changeOrderId} currentUserId={currentUserId} />
        </div>
      )}
    </div>
  );
}
