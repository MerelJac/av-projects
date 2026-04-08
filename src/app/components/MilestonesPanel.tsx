"use client";
import { useState } from "react";
import {
  Milestone, Plus, Check, Pencil, Trash2, X, Calendar, AlertCircle, Clock,
} from "lucide-react";

type MilestoneItem = {
  id: string;
  name: string;
  dueDate: string | null;
  completed: boolean;
};

function getDueStatus(dueDate: string | null, completed: boolean): {
  label: string; color: string; urgent: boolean;
} {
  if (completed) return { label: "Complete", color: "text-green-600", urgent: false };
  if (!dueDate) return { label: "No date", color: "text-[#bbb]", urgent: false };
  const due = new Date(dueDate);
  const now = new Date();
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { label: `${Math.abs(diffDays)}d overdue`, color: "text-red-600", urgent: true };
  if (diffDays === 0) return { label: "Due today", color: "text-amber-600", urgent: true };
  if (diffDays <= 7) return { label: `${diffDays}d left`, color: "text-amber-500", urgent: true };
  if (diffDays <= 30) return { label: `${diffDays}d left`, color: "text-[#666]", urgent: false };
  return { label: due.toLocaleDateString(), color: "text-[#999]", urgent: false };
}

export default function MilestonesPanel({
  projectId,
  initialMilestones,
}: {
  projectId: string;
  initialMilestones: MilestoneItem[];
}) {
  const [milestones, setMilestones] = useState<MilestoneItem[]>(initialMilestones);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const completed = milestones.filter((m) => m.completed).length;
  const pct = milestones.length > 0 ? Math.round((completed / milestones.length) * 100) : 0;

  async function refresh() {
    const res = await fetch(`/api/projects/${projectId}/milestones`);
    if (res.ok) setMilestones(await res.json());
  }

  async function toggleComplete(m: MilestoneItem) {
    await fetch(`/api/projects/${projectId}/milestones/${m.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !m.completed }),
    });
    await refresh();
  }

  async function deleteMilestone(id: string) {
    await fetch(`/api/projects/${projectId}/milestones/${id}`, { method: "DELETE" });
    await refresh();
  }

  return (
    <div className="bg-white border border-[#E5E3DE] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#F0EEE9] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Milestone size={15} className="text-[#999]" />
          <h3 className="font-semibold text-sm text-[#111]">Milestones</h3>
          {milestones.length > 0 && (
            <span className="text-xs text-[#bbb]">{milestones.length}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {milestones.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-24 h-1.5 bg-[#F0EEE9] rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs text-[#999]">{completed}/{milestones.length}</span>
            </div>
          )}
          <button
            onClick={() => { setShowAdd(true); setEditingId(null); }} disabled={true} // Disable bc coming soon
            className="flex items-center gap-1.5 text-xs font-semibold bg-[#111] text-white px-3 py-1.5 rounded-lg hover:bg-[#333] transition-colors"
          >
            <Plus size={11} />
            Add
          </button>
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <MilestoneForm
          projectId={projectId}
          onSaved={async () => { await refresh(); setShowAdd(false); }}
          onCancel={() => setShowAdd(false)}
        />
      )}

      {/* List */}
      {milestones.length === 0 && !showAdd ? (
        <div className="px-6 py-10 text-center">
          <p className="text-sm text-[#bbb]">Coming soon.</p>
        </div>
      ) : (
        <div className="divide-y divide-[#F7F6F3]">
          {milestones.map((m) => {
            const due = getDueStatus(m.dueDate, m.completed);
            return editingId === m.id ? (
              <MilestoneForm
                key={m.id}
                projectId={projectId}
                existing={m}
                onSaved={async () => { await refresh(); setEditingId(null); }}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div
                key={m.id}
                className="px-6 py-3.5 flex items-center gap-3 group hover:bg-[#FAFAF9] transition-colors"
              >
                {/* Toggle button */}
                <button
                  onClick={() => toggleComplete(m)}
                  className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                    m.completed
                      ? "bg-green-500 border-green-500 hover:bg-green-600"
                      : "border-[#ccc] hover:border-green-400"
                  }`}
                >
                  {m.completed && <Check size={11} className="text-white" />}
                </button>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${m.completed ? "line-through text-[#aaa]" : "text-[#111]"}`}>
                    {m.name}
                  </p>
                </div>

                {/* Due date status */}
                <div className={`flex items-center gap-1 text-xs flex-shrink-0 ${due.color}`}>
                  {due.urgent && !m.completed && <AlertCircle size={11} />}
                  {!due.urgent && m.dueDate && !m.completed && <Clock size={11} />}
                  {m.completed && <Check size={11} />}
                  <span>{due.label}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => { setEditingId(m.id); setShowAdd(false); }}
                    className="p-1.5 rounded-lg text-[#999] hover:text-[#111] hover:bg-[#F0EEE9] transition-colors"
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    onClick={() => deleteMilestone(m.id)}
                    className="p-1.5 rounded-lg text-[#999] hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {error && (
        <p className="px-6 pb-3 text-xs text-red-600 flex items-center gap-1.5">
          <AlertCircle size={11} /> {error}
        </p>
      )}
    </div>
  );
}

// ─── Add / Edit Form ──────────────────────────────────────────────────────────
function MilestoneForm({
  projectId,
  existing,
  onSaved,
  onCancel,
}: {
  projectId: string;
  existing?: MilestoneItem;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(existing?.name ?? "");
  const [dueDate, setDueDate] = useState(
    existing?.dueDate ? existing.dueDate.slice(0, 10) : ""
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!name.trim()) { setError("Name is required"); return; }
    setSaving(true);
    setError(null);
    try {
      const url = existing
        ? `/api/projects/${projectId}/milestones/${existing.id}`
        : `/api/projects/${projectId}/milestones`;
      const res = await fetch(url, {
        method: existing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          dueDate: dueDate || null,
        }),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        setError(b?.error ?? "Failed to save");
        return;
      }
      onSaved();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="px-6 py-4 bg-[#FAFAF9] border-b border-[#F0EEE9]">
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          placeholder="Milestone name…"
          autoFocus
          className="flex-1 text-sm border border-[#E5E3DE] rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-[#111]"
        />
        <div className="flex items-center gap-1.5 border border-[#E5E3DE] rounded-xl px-3 py-2 bg-white">
          <Calendar size={13} className="text-[#999]" />
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="text-sm text-[#666] focus:outline-none bg-transparent"
          />
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-sm font-semibold px-4 py-2 rounded-xl bg-[#111] text-white hover:bg-[#333] disabled:opacity-40 transition-colors"
        >
          {saving ? "…" : existing ? "Save" : "Add"}
        </button>
        <button onClick={onCancel} className="text-[#999] hover:text-[#111]">
          <X size={15} />
        </button>
      </div>
      {error && (
        <p className="text-xs text-red-600 mt-2 flex items-center gap-1.5">
          <AlertCircle size={11} /> {error}
        </p>
      )}
    </div>
  );
}