"use client";
import { useState } from "react";
import {
  Target,
  Plus,
  Pencil,
  Trash2,
  X,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  User,
} from "lucide-react";

type TimeEntry = {
  id: string;
  hours: number;
  notes: string | null;
  date: Date; // Date object, not string
  user: {
    id: string;
    email: string;
    profile: { firstName: string; lastName: string } | null;
  };
};

type Scope = {
  id: string;
  name: string;
  estimatedHours: number;
  timeEntries: TimeEntry[];
};

type TeamUser = {
  id: string;
  email: string;
  profile: { firstName: string; lastName: string } | null;
};
export default function ScopesPanel({
  projectId,
  initialScopes,
  teamUsers,
  currentUserId,
}: {
  projectId: string;
  initialScopes: Scope[];
  teamUsers: TeamUser[];
  currentUserId?: string;
}) {
  const [scopes, setScopes] = useState<Scope[]>(initialScopes);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [logFor, setLogFor] = useState<string | null>(null);

  const totalEstimated = scopes.reduce((s, sc) => s + sc.estimatedHours, 0);
  const totalActual = scopes.reduce(
    (s, sc) => s + sc.timeEntries.reduce((a, t) => a + t.hours, 0),
    0,
  );

  async function refresh() {
    const res = await fetch(`/api/projects/${projectId}/scopes`);
    if (res.ok) setScopes(await res.json());
  }

  async function deleteScope(id: string) {
    await fetch(`/api/projects/${projectId}/scopes/${id}`, {
      method: "DELETE",
    });
    await refresh();
  }

  async function deleteEntry(scopeId: string, entryId: string) {
    await fetch(
      `/api/projects/${projectId}/scopes/${scopeId}/time-entries/${entryId}`,
      {
        method: "DELETE",
      },
    );
    await refresh();
  }

  function toggle(id: string) {
    setExpanded((p) => ({ ...p, [id]: !p[id] }));
  }

  return (
    <div className="bg-white border border-[#E5E3DE] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#F0EEE9] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Target size={15} className="text-[#999]" />
          <h3 className="font-semibold text-sm text-[#111]">Scope & Hours</h3>
          {scopes.length > 0 && (
            <span className="text-xs text-[#bbb]">{scopes.length}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {scopes.length > 0 && (
            <span
              className={`text-xs font-medium ${totalActual > totalEstimated ? "text-red-600" : "text-[#999]"}`}
            >
              {totalActual.toFixed(1)} / {totalEstimated}h
            </span>
          )}
          <button
            onClick={() => {
              setShowAdd(true);
              setEditingId(null);
            }}
            className="flex items-center gap-1.5 text-xs font-semibold bg-[#111] text-white px-3 py-1.5 rounded-lg hover:bg-[#333] transition-colors"
          >
            <Plus size={11} />
            Add Scope
          </button>
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <ScopeForm
          projectId={projectId}
          onSaved={async () => {
            await refresh();
            setShowAdd(false);
          }}
          onCancel={() => setShowAdd(false)}
        />
      )}

      {scopes.length === 0 && !showAdd ? (
        <div className="px-6 py-10 text-center">
          <p className="text-sm text-[#bbb]">
            No scopes yet — add one to start tracking hours
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[#F7F6F3]">
          {scopes.map((sc) => {
            const actual = sc.timeEntries.reduce((s, t) => s + t.hours, 0);
            const pct =
              sc.estimatedHours > 0
                ? Math.min((actual / sc.estimatedHours) * 100, 100)
                : 0;
            const over = actual > sc.estimatedHours && sc.estimatedHours > 0;
            const isExpanded = !!expanded[sc.id];

            return (
              <div key={sc.id}>
                {editingId === sc.id ? (
                  <ScopeForm
                    projectId={projectId}
                    existing={sc}
                    onSaved={async () => {
                      await refresh();
                      setEditingId(null);
                    }}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <div
                    className="px-6 py-4 hover:bg-[#FAFAF9] transition-colors cursor-pointer group"
                    onClick={() => toggle(sc.id)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-[#ccc]">
                        {isExpanded ? (
                          <ChevronDown size={14} />
                        ) : (
                          <ChevronRight size={14} />
                        )}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-4">
                          <p className="text-sm font-semibold text-[#111]">
                            {sc.name}
                          </p>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span
                              className={`text-xs font-medium ${over ? "text-red-600" : "text-[#666]"}`}
                            >
                              {actual.toFixed(1)} / {sc.estimatedHours}h
                            </span>
                            <div
                              className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={() => {
                                  setLogFor(sc.id);
                                  setExpanded((p) => ({ ...p, [sc.id]: true }));
                                }}
                                className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg bg-[#111] text-white hover:bg-[#333] transition-colors"
                              >
                                <Plus size={10} />
                                Log Hours
                              </button>
                              <button
                                onClick={() => {
                                  setEditingId(sc.id);
                                  setShowAdd(false);
                                }}
                                className="p-1.5 rounded-lg text-[#999] hover:text-[#111] hover:bg-[#F0EEE9] transition-colors"
                              >
                                <Pencil size={12} />
                              </button>
                              <button
                                onClick={() => deleteScope(sc.id)}
                                className="p-1.5 rounded-lg text-[#999] hover:text-red-600 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        </div>
                        {/* Progress bar */}
                        <div className="mt-2 w-full h-1.5 bg-[#F0EEE9] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${over ? "bg-red-400" : pct > 80 ? "bg-amber-400" : "bg-green-500"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Expanded: log form + entries */}
                {isExpanded && (
                  <div className="bg-[#FAFAF9] border-t border-[#F0EEE9]">
                    {/* Log hours form */}
                    {logFor === sc.id && (
                      <LogHoursForm
                        projectId={projectId}
                        scopeId={sc.id}
                        teamUsers={teamUsers}
                        currentUserId={currentUserId}
                        onSaved={async () => {
                          await refresh();
                          setLogFor(null);
                        }}
                        onCancel={() => setLogFor(null)}
                      />
                    )}

                    {logFor !== sc.id && (
                      <div className="px-6 pt-3 pb-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setLogFor(sc.id);
                          }}
                          className="flex items-center gap-1.5 text-xs font-semibold text-[#666] hover:text-[#111] transition-colors"
                        >
                          <Plus size={11} />
                          Log Hours
                        </button>
                      </div>
                    )}

                    {/* Time entries */}
                    {sc.timeEntries.length === 0 ? (
                      <p className="px-6 py-3 text-xs text-[#bbb]">
                        No hours logged yet
                      </p>
                    ) : (
                      <div className="divide-y divide-[#F0EEE9]">
                        {sc.timeEntries.map((entry) => (
                          <div
                            key={entry.id}
                            className="px-6 py-3 flex items-start justify-between group/entry"
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-6 h-6 rounded-full bg-[#E5E3DE] flex items-center justify-center flex-shrink-0 mt-0.5">
                                <User size={11} className="text-[#666]" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-semibold text-[#111]">
                                    {entry.user.profile?.firstName ?? entry.user.email}
                                  </span>
                                  <span className="text-xs font-bold text-[#333]">
                                    {entry.hours}h
                                  </span>
                                  <span className="text-[10px] text-[#bbb]">
                                    {new Date(entry.date).toLocaleDateString()}
                                  </span>
                                </div>
                                {entry.notes && (
                                  <p className="text-xs text-[#999] mt-0.5">
                                    {entry.notes}
                                  </p>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => deleteEntry(sc.id, entry.id)}
                              className="p-1 rounded text-[#ccc] hover:text-red-500 opacity-0 group-hover/entry:opacity-100 transition-all"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Scope Form ───────────────────────────────────────────────────────────────
function ScopeForm({
  projectId,
  existing,
  onSaved,
  onCancel,
}: {
  projectId: string;
  existing?: { id: string; name: string; estimatedHours: number };
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(existing?.name ?? "");
  const [hours, setHours] = useState(
    existing?.estimatedHours?.toString() ?? "",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const url = existing
        ? `/api/projects/${projectId}/scopes/${existing.id}`
        : `/api/projects/${projectId}/scopes`;
      const res = await fetch(url, {
        method: existing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          estimatedHours: parseFloat(hours) || 0,
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
          placeholder="Scope name (e.g. Installation, Programming…)"
          autoFocus
          className="flex-1 text-sm border border-[#E5E3DE] rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-[#111]"
        />
        <div className="flex items-center gap-1.5 border border-[#E5E3DE] rounded-xl px-3 py-2 bg-white w-32">
          <Clock size={13} className="text-[#999] flex-shrink-0" />
          <input
            type="number"
            min={0}
            step={0.5}
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            placeholder="Est. hrs"
            className="text-sm text-[#666] focus:outline-none bg-transparent w-full"
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

// ─── Log Hours Form ───────────────────────────────────────────────────────────
function LogHoursForm({
  projectId,
  scopeId,
  teamUsers,
  currentUserId,
  onSaved,
  onCancel,
}: {
  projectId: string;
  scopeId: string;
  teamUsers: TeamUser[];
  currentUserId?: string;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [userId, setUserId] = useState(currentUserId ?? teamUsers[0]?.id ?? "");
  const [hours, setHours] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!hours || parseFloat(hours) <= 0) {
      setError("Enter valid hours");
      return;
    }
    if (!userId) {
      setError("Select a team member");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/scopes/${scopeId}/time-entries`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            hours: parseFloat(hours),
            notes: notes.trim() || null,
            date,
          }),
        },
      );
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
    <div className="px-6 py-4 border-b border-[#F0EEE9] bg-white">
      <p className="text-xs font-semibold text-[#666] uppercase tracking-widest mb-3">
        Log Hours
      </p>
      <div className="flex items-start gap-3 flex-wrap">
        <select
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="text-sm border border-[#E5E3DE] rounded-xl px-3 py-2 focus:outline-none focus:border-[#111] bg-white"
        >
          {teamUsers.map((u) => (
            <option key={u.id} value={u.id}>
              {u.profile?.firstName ?? u.email}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-1.5 border border-[#E5E3DE] rounded-xl px-3 py-2 bg-white w-28">
          <Clock size={13} className="text-[#999] flex-shrink-0" />
          <input
            type="number"
            min={0.5}
            step={0.5}
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            placeholder="Hours"
            autoFocus
            className="text-sm text-[#666] focus:outline-none bg-transparent w-full"
          />
        </div>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="text-sm border border-[#E5E3DE] rounded-xl px-3 py-2 focus:outline-none focus:border-[#111] bg-white"
        />
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          placeholder="Notes (optional)"
          className="flex-1 min-w-48 text-sm border border-[#E5E3DE] rounded-xl px-3 py-2 focus:outline-none focus:border-[#111] bg-white"
        />
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-sm font-semibold px-4 py-2 rounded-xl bg-[#111] text-white hover:bg-[#333] disabled:opacity-40 transition-colors"
        >
          {saving ? "…" : "Log"}
        </button>
        <button
          onClick={onCancel}
          className="text-[#999] hover:text-[#111] mt-2"
        >
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
