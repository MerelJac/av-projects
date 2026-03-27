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
  Download,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

type Item = { id: string; itemNumber: string; manufacturer: string | null };

type TimeEntry = {
  id: string;
  hours: number;
  notes: string | null;
  date: Date | string;
  user: {
    id: string;
    email: string;
    profile: {
      id: string;
      userId: string;
      firstName: string;
      lastName: string;
      phone: string | null;
    } | null;
  };
};

type Scope = {
  id: string;
  name: string;
  estimatedHours: number;
  itemId: string | null;
  item: Item | null;
  timeEntries: TimeEntry[];
};

type TeamUser = {
  id: string;
  email: string;
  profile: { firstName: string; lastName: string } | null;
};

type ProjectBOM = { id: string; name: string };

function userName(u: TeamUser): string {
  if (u.profile) return `${u.profile.firstName} ${u.profile.lastName}`.trim();
  return u.email;
}

export default function ScopesPanel({
  projectId,
  initialScopes,
  teamUsers,
  currentUserId,
  projectBoms,
}: {
  projectId: string;
  initialScopes: Scope[];
  teamUsers: TeamUser[];
  currentUserId?: string;
  projectBoms: ProjectBOM[];
}) {
  const [scopes, setScopes] = useState<Scope[]>(initialScopes);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [logFor, setLogFor] = useState<string | null>(null);
  const [pulling, setPulling] = useState(false);
  const [pullMsg, setPullMsg] = useState<string | null>(null);
  const [showPullMenu, setShowPullMenu] = useState(false);
  const totalEstimated = scopes.reduce((s, sc) => s + sc.estimatedHours, 0);
  const totalActual = scopes.reduce(
    (s, sc) => s + sc.timeEntries.reduce((a, t) => a + t.hours, 0),
    0,
  );

  async function refresh() {
    const res = await fetch(`/api/projects/${projectId}/scopes`);
    if (res.ok) setScopes(await res.json());
  }

  async function pullFromBom(bomId: string) {
    setPulling(true);
    setPullMsg(null);
    const res = await fetch(`/api/projects/${projectId}/scopes/pull-from-bom`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bomId }),
    });
    if (res.ok) {
      const { created, skipped } = await res.json();
      setPullMsg(
        `Added ${created} scope${created !== 1 ? "s" : ""}${skipped > 0 ? `, ${skipped} already existed` : ""}`,
      );
      await refresh();
    }
    setPulling(false);
  }

  async function pullFromAllBoms() {
    setPulling(true);
    setPullMsg(null);
    let totalCreated = 0;
    let totalSkipped = 0;
    for (const b of projectBoms) {
      const res = await fetch(`/api/projects/${projectId}/scopes/pull-from-bom`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bomId: b.id }),
      });
      if (res.ok) {
        const { created, skipped } = await res.json();
        totalCreated += created;
        totalSkipped += skipped;
      }
    }
    setPullMsg(
      `Added ${totalCreated} scope${totalCreated !== 1 ? "s" : ""}${totalSkipped > 0 ? `, ${totalSkipped} already existed` : ""}`,
    );
    await refresh();
    setPulling(false);
  }

  async function deleteScope(id: string) {
    if (
      !confirm(
        `Are you sure you want to delete this scope? This cannot be undone.`,
      )
    )
      return;

    await fetch(`/api/projects/${projectId}/scopes/${id}`, {
      method: "DELETE",
    });
    await refresh();
  }

  async function deleteEntry(scopeId: string, entryId: string) {
        if (
      !confirm(
        `Are you sure you want to delete this time log? This cannot be undone.`,
      )
    )
      return;
    await fetch(
      `/api/projects/${projectId}/scopes/${scopeId}/time-entries/${entryId}`,
      { method: "DELETE" },
    );
    await refresh();
  }

  function toggle(id: string) {
    setExpanded((p) => ({ ...p, [id]: !p[id] }));
  }

  return (
    <div className="bg-white border border-[#E5E3DE] rounded-2xl ">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#F0EEE9] flex items-center justify-between">
        <div className="flex flex-col items-center gap-1">
          <div className="flex flex-row gap-2.5 items-center">
            <Target size={15} className="text-[#999]" />
            <h3 className="font-semibold text-sm text-[#111]">Scope & Hours</h3>

            {scopes.length > 0 && (
              <span className="text-xs text-[#bbb]">{scopes.length}</span>
            )}
          </div>
          <p className="text-xs text-[#bbb]">
            Pulls <code>SERVICE</code> items
          </p>
        </div>

        <div className="flex items-center gap-3">
          {scopes.length > 0 && (
            <span
              className={`text-xs font-medium ${totalActual > totalEstimated ? "text-red-600" : "text-[#999]"}`}
            >
              {totalActual.toFixed(1)} / {totalEstimated}h
            </span>
          )}
          {/* Pull from BOM dropdown */}
          {projectBoms.length > 0 && (
            <div className="relative">
              <button
                disabled={pulling}
                onClick={() => setShowPullMenu((p) => !p)}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#E5E3DE] text-[#666] hover:border-[#111] hover:text-[#111] transition-colors disabled:opacity-40"
              >
                <Download size={11} />
                Pull from BOMs
              </button>
              
              {showPullMenu && (
                <>
                  <div
                    className="fixed inset-0"
                    onClick={() => setShowPullMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 bg-white border border-[#E5E3DE] rounded-xl shadow-lg z-20 min-w-48">
                    {projectBoms.length > 1 && (
                      <>
                        <button
                          onClick={() => { setShowPullMenu(false); pullFromAllBoms(); }}
                          className="w-full text-left px-4 py-2.5 text-xs font-semibold text-[#111] hover:bg-[#F7F6F3] first:rounded-t-xl border-b border-[#F0EEE9]"
                        >
                          All BOMs
                        </button>
                      </>
                    )}
                    {projectBoms.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => {
                          pullFromBom(b.id);
                          setShowPullMenu(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs text-[#111] hover:bg-[#F7F6F3] last:rounded-b-xl"
                      >
                        {b.name}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
                    <Link
            href={`/projects/${projectId}/time`}
            className="flex items-center gap-1 text-xs font-semibold text-[#666] hover:text-[#111] transition-colors"
          >
            Time Card <ArrowRight size={11} />
          </Link>
          {/* <button
            onClick={() => {
              setShowAdd(true);
              setEditingId(null);
            }}
            className="flex items-center gap-1.5 text-xs font-semibold bg-[#111] text-white px-3 py-1.5 rounded-lg hover:bg-[#333] transition-colors"
          >
            <Plus size={11} />
            Add Scope
          </button> */}
        </div>
      </div>

      {/* Pull message */}
      {pullMsg && (
        <div className="px-6 py-2.5 bg-green-50 border-b border-green-100 text-xs font-medium text-green-700 flex items-center justify-between">
          {pullMsg}
          <button
            onClick={() => setPullMsg(null)}
            className="text-green-500 hover:text-green-700"
          >
            <X size={12} />
          </button>
        </div>
      )}

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
            No scopes yet — pull SERVICE items from a BOM to get started
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
                          <div className="min-w-0">
                            {sc.item && (
                              <span className="text-[10px] font-mono font-semibold text-[#999] mr-2">
                                {sc.item.itemNumber}
                              </span>
                            )}
                            <span className="text-sm font-semibold text-[#111]">
                              {sc.name}
                            </span>
                          </div>
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
                        <div className="mt-2 w-full h-1.5 bg-[#F0EEE9] rounded-full ">
                          <div
                            className={`h-full rounded-full transition-all ${over ? "bg-red-400" : pct > 80 ? "bg-amber-400" : "bg-green-500"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {isExpanded && (
                  <div className="bg-[#FAFAF9] border-t border-[#F0EEE9]">
                    {logFor === sc.id ? (
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
                    ) : (
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
                                    {userName(entry.user)}
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
  existing?: Scope;
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
          itemId: existing?.itemId ?? null,
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
        {existing?.item && (
          <span className="text-xs font-mono font-semibold text-[#999] bg-[#F0EEE9] px-2 py-1 rounded-lg flex-shrink-0">
            {existing.item.itemNumber}
          </span>
        )}
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          placeholder="Scope name…"
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
              {userName(u)}
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
