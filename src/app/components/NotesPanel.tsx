"use client";
import { useEffect, useState, useRef } from "react";
import { StickyNote, Trash2, Send } from "lucide-react";

type NoteDocumentType = "QUOTE" | "BILL_OF_MATERIALS" | "CHANGE_ORDER";

type NoteUser = {
  id: string;
  profile: { firstName: string; lastName: string } | null;
};

type Note = {
  id: string;
  content: string;
  createdAt: string;
  userId: string;
  user: NoteUser;
};

export default function NotesPanel({
  documentType,
  documentId,
  currentUserId,
}: {
  documentType: NoteDocumentType;
  documentId: string;
  currentUserId?: string;
}) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
          // console log
      console.log("Fetched notes for", documentType, documentId);
    fetch(`/api/notes?documentType=${documentType}&documentId=${documentId}`)
      .then((r) => {
        if (!r.ok || r.status === 204) return [];
        return r.text().then((text) => (text ? JSON.parse(text) : []));
      })
      .then(setNotes)
      .catch(() => setNotes([]));

      
  }, [documentType, documentId]);

  async function handleAdd() {
    if (!content.trim()) return;
    setSaving(true);
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentType, documentId, content }),
    });
    if (res.ok) {
      const note = await res.json();
      setNotes((prev) => [...prev, note]);
      setContent("");
      textareaRef.current?.focus();
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/notes/${id}`, { method: "DELETE" });
    if (res.ok) {
      setNotes((prev) => prev.filter((n) => n.id !== id));
    }
  }

  function formatAuthor(user: NoteUser) {
    if (user.profile) {
      return `${user.profile.firstName} ${user.profile.lastName}`;
    }
    return "Team member";
  }

  function formatDate(iso: string) {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return d.toLocaleDateString();
  }

  return (
    <div className="bg-white border border-[#E5E3DE] rounded-2xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[#F0EEE9] flex items-center gap-2">
        <StickyNote size={14} className="text-[#999]" />
        <h3 className="text-sm font-semibold text-[#111]">Internal Notes</h3>
        {notes.length > 0 && (
          <span className="text-xs text-[#bbb]">{notes.length}</span>
        )}
      </div>

      <div className="divide-y divide-[#F7F6F3]">
        {notes.length === 0 && (
          <p className="px-5 py-6 text-sm text-[#bbb] text-center">
            No notes yet
          </p>
        )}
        {notes.map((note) => (
          <div key={note.id} className="px-5 py-3.5 group">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-[#111]">
                    {formatAuthor(note.user)}
                  </span>
                  <span className="text-[10px] text-[#bbb]">
                    {formatDate(note.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-[#444] whitespace-pre-wrap break-words">
                  {note.content}
                </p>
              </div>
              {currentUserId === note.userId && (
                <button
                  onClick={() => handleDelete(note.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-lg hover:bg-red-50 text-[#ccc] hover:text-red-500"
                  title="Delete note"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="px-5 py-3.5 border-t border-[#F0EEE9] flex gap-2 items-end">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAdd();
          }}
          placeholder="Add an internal note…"
          rows={2}
          className="flex-1 text-sm text-[#111] placeholder-[#bbb] bg-[#F7F6F3] rounded-xl px-3 py-2 resize-none outline-none focus:ring-2 focus:ring-[#111]/10"
        />
        <button
          onClick={handleAdd}
          disabled={saving || !content.trim()}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#111] text-white hover:bg-[#333] disabled:opacity-40 transition-colors flex-shrink-0"
          title="Add note (⌘↵)"
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}