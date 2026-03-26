"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Clock,
  Plus,
  Trash2,
  User,
  TrendingUp,
  TrendingDown,
  FileText,
  X,
  AlertCircle,
  Download,
} from "lucide-react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────
type Profile = { firstName: string; lastName: string; phone: string | null } | null;
type TeamUser = { id: string; email: string; profile: Profile };
type TimeEntry = {
  id: string;
  hours: number;
  notes: string | null;
  date: Date | string;
  user: { id: string; email: string; profile: Profile };
};
type InvoiceLine = { id: string; quantity: number; price: number };
type Scope = {
  id: string;
  name: string;
  estimatedHours: number;
  ratePerHour: number | null;
  costPerHour: number | null;
  itemId: string | null;
  item: { id: string; itemNumber: string; manufacturer: string | null } | null;
  timeEntries: TimeEntry[];
  invoiceLines: InvoiceLine[];
};
type Project = {
  id: string;
  name: string;
  customer: { name: string };
};

function userName(u: { email: string; profile: Profile }) {
  if (u.profile) return `${u.profile.firstName} ${u.profile.lastName}`.trim();
  return u.email;
}

function fmt(n: number) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function TimeCardEditor({
  project,
  scopes: initialScopes,
  teamUsers,
  currentUserId,
  projectBoms,
}: {
  project: Project;
  scopes: Scope[];
  teamUsers: TeamUser[];
  currentUserId?: string;
  projectBoms: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [scopes, setScopes] = useState<Scope[]>(initialScopes);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [logFor, setLogFor] = useState<string | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [pulling, setPulling] = useState(false);
  const [showPullMenu, setShowPullMenu] = useState(false);
  const [pullMsg, setPullMsg] = useState<string | null>(null);

  async function pullFromBom(bomId: string) {
    setPulling(true);
    setPullMsg(null);
    try {
      const res = await fetch(`/api/projects/${project.id}/scopes/pull-from-bom`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bomId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setPullMsg(data?.error ?? "Pull failed"); return; }
      setPullMsg(`Pulled ${data.added ?? 0} scope(s) from BOM`);
      await refresh();
    } catch { setPullMsg("Network error"); } finally { setPulling(false); }
  }

  async function pullFromAllBoms() {
    setPulling(true);
    setPullMsg(null);
    let totalAdded = 0;
    try {
      for (const b of projectBoms) {
        const res = await fetch(`/api/projects/${project.id}/scopes/pull-from-bom`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bomId: b.id }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) totalAdded += data.added ?? 0;
      }
      setPullMsg(`Pulled ${totalAdded} scope(s) from all BOMs`);
      await refresh();
    } catch { setPullMsg("Network error"); } finally { setPulling(false); }
  }

  async function refresh() {
    const res = await fetch(`/api/projects/${project.id}/scopes`);
    if (res.ok) setScopes(await res.json());
  }

  async function deleteEntry(scopeId: string, entryId: string) {
    await fetch(
      `/api/projects/${project.id}/scopes/${scopeId}/time-entries/${entryId}`,
      { method: "DELETE" },
    );
    await refresh();
  }

  // ── Aggregate numbers ──
  const totalEstimated = scopes.reduce((s, sc) => s + sc.estimatedHours, 0);
  const totalActual = scopes.reduce(
    (s, sc) => s + sc.timeEntries.reduce((a, t) => a + t.hours, 0),
    0,
  );
  const totalBilled = scopes.reduce(
    (s, sc) => s + sc.invoiceLines.reduce((a, l) => a + l.quantity, 0),
    0,
  );
  const totalEstRevenue = scopes.reduce(
    (s, sc) => s + (sc.ratePerHour ? sc.estimatedHours * sc.ratePerHour : 0),
    0,
  );
  const totalLaborCost = scopes.reduce(
    (s, sc) => s + (sc.costPerHour ? sc.timeEntries.reduce((a, t) => a + t.hours, 0) * sc.costPerHour : 0),
    0,
  );
  const totalBilledRevenue = scopes.reduce(
    (s, sc) => s + (sc.ratePerHour ? sc.invoiceLines.reduce((a, l) => a + l.quantity, 0) * sc.ratePerHour : 0),
    0,
  );
  const hasRates = scopes.some((sc) => sc.ratePerHour);

  return (
    <div className="min-h-screen bg-[#F7F6F3]">
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href={`/projects/${project.id}`}
            className="p-1.5 rounded-lg text-[#999] hover:text-[#111] hover:bg-white transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <p className="text-xs text-[#999]">{project.customer.name} / {project.name}</p>
            <h1 className="text-xl font-bold text-[#111] tracking-tight">Time Card</h1>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white border border-[#E5E3DE] rounded-2xl overflow-hidden">
          <div className="grid grid-cols-3 divide-x divide-[#F0EEE9]">
            <div className="px-6 py-5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#999] mb-1">Hours</p>
              <p className="text-2xl font-bold text-[#111]">{totalActual.toFixed(1)}</p>
              <p className="text-xs text-[#999] mt-0.5">of {totalEstimated.toFixed(1)} estimated</p>
              <div className="mt-2 h-1.5 bg-[#F0EEE9] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${totalActual > totalEstimated ? "bg-red-400" : "bg-green-500"}`}
                  style={{ width: `${Math.min((totalActual / Math.max(totalEstimated, 0.01)) * 100, 100)}%` }}
                />
              </div>
            </div>
            <div className="px-6 py-5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#999] mb-1">Billed</p>
              <p className="text-2xl font-bold text-[#111]">{totalBilled.toFixed(1)}h</p>
              {hasRates && (
                <p className="text-xs text-[#999] mt-0.5">${fmt(totalBilledRevenue)} invoiced</p>
              )}
              <p className="text-xs text-green-600 mt-0.5 font-medium">
                {(totalActual - totalBilled).toFixed(1)}h unbilled
              </p>
            </div>
            {hasRates && (
              <div className="px-6 py-5">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#999] mb-1">Service P&L</p>
                <p className="text-2xl font-bold text-[#111]">${fmt(totalEstRevenue - totalLaborCost)}</p>
                <p className="text-xs text-[#999] mt-0.5">
                  ${fmt(totalEstRevenue)} rev — ${fmt(totalLaborCost)} cost
                </p>
                {totalEstRevenue > 0 && (
                  <p className={`text-xs font-medium mt-0.5 ${((totalEstRevenue - totalLaborCost) / totalEstRevenue) > 0.3 ? "text-green-600" : "text-amber-600"}`}>
                    {(((totalEstRevenue - totalLaborCost) / totalEstRevenue) * 100).toFixed(1)}% GM
                  </p>
                )}
              </div>
            )}
            {!hasRates && (
              <div className="px-6 py-5">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#999] mb-1">Service P&L</p>
                <p className="text-sm text-[#bbb] mt-2">Pull from BOM to see rates</p>
              </div>
            )}
          </div>
        </div>

        {/* Pull message banner */}
        {pullMsg && (
          <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-green-50 border border-green-200 rounded-xl text-xs text-green-800">
            <span>{pullMsg}</span>
            <button onClick={() => setPullMsg(null)} className="text-green-600 hover:text-green-900"><X size={13} /></button>
          </div>
        )}

        {/* Action buttons */}
        {(scopes.length > 0 || projectBoms.length > 0) && (
          <div className="flex justify-end gap-2">
            {projectBoms.length > 0 && (
              <div className="relative">
                <button
                  disabled={pulling}
                  onClick={() => setShowPullMenu((p) => !p)}
                  className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl border border-[#E5E3DE] text-[#666] hover:border-[#111] hover:text-[#111] transition-colors disabled:opacity-40"
                >
                  <Download size={14} />
                  {pulling ? "Pulling…" : "Pull from BOM"}
                </button>
                {showPullMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowPullMenu(false)} />
                    <div className="absolute right-0 top-full mt-1 bg-white border border-[#E5E3DE] rounded-xl shadow-lg z-20 min-w-48">
                      {projectBoms.length > 1 && (
                        <button
                          onClick={() => { setShowPullMenu(false); pullFromAllBoms(); }}
                          className="w-full text-left px-4 py-2.5 text-xs font-semibold text-[#111] hover:bg-[#F7F6F3] first:rounded-t-xl border-b border-[#F0EEE9]"
                        >
                          All BOMs
                        </button>
                      )}
                      {projectBoms.map((b) => (
                        <button
                          key={b.id}
                          onClick={() => { pullFromBom(b.id); setShowPullMenu(false); }}
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
            {scopes.length > 0 && (
              <button
                onClick={() => setShowInvoiceModal(true)}
                className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl bg-[#111] text-white hover:bg-[#333] transition-colors"
              >
                <FileText size={14} />
                Invoice Hours
              </button>
            )}
          </div>
        )}

        {/* Scope rows */}
        {scopes.length === 0 ? (
          <div className="bg-white border border-[#E5E3DE] rounded-2xl px-6 py-14 text-center">
            <Clock size={28} className="text-[#ddd] mx-auto mb-3" />
            <p className="text-sm text-[#bbb]">No scopes yet — pull SERVICE items from a BOM on the project page</p>
          </div>
        ) : (
          <div className="space-y-3">
            {scopes.map((sc) => {
              const actual = sc.timeEntries.reduce((s, t) => s + t.hours, 0);
              const billed = sc.invoiceLines.reduce((s, l) => s + l.quantity, 0);
              const pct = sc.estimatedHours > 0 ? Math.min((actual / sc.estimatedHours) * 100, 100) : 0;
              const over = actual > sc.estimatedHours && sc.estimatedHours > 0;
              const variance = actual - sc.estimatedHours;
              const estRevenue = sc.ratePerHour ? sc.estimatedHours * sc.ratePerHour : null;
              const laborCost = sc.costPerHour ? actual * sc.costPerHour : null;
              const billedRevenue = sc.ratePerHour ? billed * sc.ratePerHour : null;
              const varDollar = sc.costPerHour ? variance * sc.costPerHour : null;
              const isExpanded = !!expanded[sc.id];

              return (
                <div key={sc.id} className="bg-white border border-[#E5E3DE] rounded-2xl overflow-hidden">
                  {/* Scope header */}
                  <div
                    className="px-6 py-4 cursor-pointer hover:bg-[#FAFAF9] transition-colors"
                    onClick={() => setExpanded((p) => ({ ...p, [sc.id]: !p[sc.id] }))}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-[#ccc] flex-shrink-0">
                          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </span>
                        <div className="min-w-0">
                          {sc.item && (
                            <span className="text-[10px] font-mono font-semibold text-[#999] mr-2">
                              {sc.item.itemNumber}
                            </span>
                          )}
                          <span className="text-sm font-semibold text-[#111]">{sc.name}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0">
                        {/* Hour variance badge */}
                        {sc.estimatedHours > 0 && variance !== 0 && (
                          <span className={`flex items-center gap-1 text-xs font-medium ${over ? "text-red-600" : "text-green-600"}`}>
                            {over ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                            {over ? "+" : ""}{variance.toFixed(1)}h
                          </span>
                        )}
                        <span className={`text-sm font-semibold ${over ? "text-red-600" : "text-[#111]"}`}>
                          {actual.toFixed(1)} / {sc.estimatedHours}h
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setLogFor(sc.id);
                            setExpanded((p) => ({ ...p, [sc.id]: true }));
                          }}
                          className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-[#111] text-white hover:bg-[#333] transition-colors"
                        >
                          <Plus size={10} />
                          Log
                        </button>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-2.5 ml-6">
                      <div className="w-full h-1.5 bg-[#F0EEE9] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${over ? "bg-red-400" : pct > 80 ? "bg-amber-400" : "bg-green-500"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    {/* P&L row */}
                    {(estRevenue !== null || laborCost !== null) && (
                      <div className="mt-3 ml-6 grid grid-cols-4 gap-3">
                        {estRevenue !== null && (
                          <div>
                            <p className="text-[10px] text-[#999]">Est. Revenue</p>
                            <p className="text-xs font-semibold text-[#111]">${fmt(estRevenue)}</p>
                            <p className="text-[10px] text-[#bbb]">${sc.ratePerHour}/hr</p>
                          </div>
                        )}
                        {billedRevenue !== null && (
                          <div>
                            <p className="text-[10px] text-[#999]">Billed</p>
                            <p className="text-xs font-semibold text-[#111]">${fmt(billedRevenue)}</p>
                            <p className="text-[10px] text-[#bbb]">{billed.toFixed(1)}h</p>
                          </div>
                        )}
                        {laborCost !== null && (
                          <div>
                            <p className="text-[10px] text-[#999]">Labor Cost</p>
                            <p className="text-xs font-semibold text-[#111]">${fmt(laborCost)}</p>
                            <p className="text-[10px] text-[#bbb]">${sc.costPerHour}/hr</p>
                          </div>
                        )}
                        {varDollar !== null && variance !== 0 && (
                          <div>
                            <p className="text-[10px] text-[#999]">Cost Variance</p>
                            <p className={`text-xs font-semibold ${varDollar > 0 ? "text-red-600" : "text-green-600"}`}>
                              {varDollar > 0 ? "+" : ""}${fmt(Math.abs(varDollar))}
                              <span className="text-[#bbb] font-normal ml-1">{variance > 0 ? "overrun" : "saved"}</span>
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Expanded: log form + entries */}
                  {isExpanded && (
                    <div className="border-t border-[#F0EEE9]">
                      {logFor === sc.id && (
                        <LogHoursForm
                          projectId={project.id}
                          scopeId={sc.id}
                          teamUsers={teamUsers}
                          currentUserId={currentUserId}
                          onSaved={async () => { await refresh(); setLogFor(null); }}
                          onCancel={() => setLogFor(null)}
                        />
                      )}
                      {logFor !== sc.id && (
                        <div className="px-6 pt-3 pb-2 bg-[#FAFAF9]">
                          <button
                            onClick={(e) => { e.stopPropagation(); setLogFor(sc.id); }}
                            className="flex items-center gap-1.5 text-xs font-semibold text-[#666] hover:text-[#111]"
                          >
                            <Plus size={11} /> Log Hours
                          </button>
                        </div>
                      )}
                      {sc.timeEntries.length === 0 ? (
                        <p className="px-6 py-4 text-xs text-[#bbb] bg-[#FAFAF9]">No hours logged yet</p>
                      ) : (
                        <div className="divide-y divide-[#F0EEE9] bg-[#FAFAF9]">
                          {sc.timeEntries.map((entry) => (
                            <div key={entry.id} className="px-6 py-3 flex items-start justify-between group/entry">
                              <div className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-[#E5E3DE] flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <User size={11} className="text-[#666]" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold text-[#111]">{userName(entry.user)}</span>
                                    <span className="text-xs font-bold text-[#333]">{entry.hours}h</span>
                                    <span className="text-[10px] text-[#bbb]">
                                      {new Date(entry.date).toLocaleDateString()}
                                    </span>
                                    {sc.costPerHour && (
                                      <span className="text-[10px] text-[#999]">
                                        ${fmt(entry.hours * sc.costPerHour)} cost
                                      </span>
                                    )}
                                  </div>
                                  {entry.notes && (
                                    <p className="text-xs text-[#999] mt-0.5">{entry.notes}</p>
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

      {/* Invoice Hours Modal */}
      {showInvoiceModal && (
        <InvoiceHoursModal
          projectId={project.id}
          scopes={scopes}
          onClose={() => setShowInvoiceModal(false)}
          onCreated={(invoiceId) => router.push(`/projects/${project.id}/invoices`)}
        />
      )}
    </div>
  );
}

// ─── Log Hours Form ────────────────────────────────────────────────────────────
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
    if (!hours || parseFloat(hours) <= 0) { setError("Enter valid hours"); return; }
    if (!userId) { setError("Select a team member"); return; }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/scopes/${scopeId}/time-entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, hours: parseFloat(hours), notes: notes.trim() || null, date }),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        setError(b?.error ?? "Failed to save");
        return;
      }
      onSaved();
    } catch { setError("Network error"); } finally { setSaving(false); }
  }

  return (
    <div className="px-6 py-4 bg-white border-b border-[#F0EEE9]">
      <p className="text-xs font-semibold text-[#666] uppercase tracking-widest mb-3">Log Hours</p>
      <div className="flex items-start gap-3 flex-wrap">
        <select
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="text-sm border border-[#E5E3DE] rounded-xl px-3 py-2 focus:outline-none focus:border-[#111] bg-white"
        >
          {teamUsers.map((u) => (
            <option key={u.id} value={u.id}>{userName(u)}</option>
          ))}
        </select>
        <div className="flex items-center gap-1.5 border border-[#E5E3DE] rounded-xl px-3 py-2 bg-white w-28">
          <Clock size={13} className="text-[#999] flex-shrink-0" />
          <input
            type="number" min={0.5} step={0.5} value={hours}
            onChange={(e) => setHours(e.target.value)}
            placeholder="Hours" autoFocus
            className="text-sm text-[#666] focus:outline-none bg-transparent w-full"
          />
        </div>
        <input
          type="date" value={date} onChange={(e) => setDate(e.target.value)}
          className="text-sm border border-[#E5E3DE] rounded-xl px-3 py-2 focus:outline-none focus:border-[#111] bg-white"
        />
        <input
          type="text" value={notes} onChange={(e) => setNotes(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          placeholder="Notes (optional)"
          className="flex-1 min-w-48 text-sm border border-[#E5E3DE] rounded-xl px-3 py-2 focus:outline-none focus:border-[#111] bg-white"
        />
        <button
          onClick={handleSave} disabled={saving}
          className="text-sm font-semibold px-4 py-2 rounded-xl bg-[#111] text-white hover:bg-[#333] disabled:opacity-40"
        >
          {saving ? "…" : "Log"}
        </button>
        <button onClick={onCancel} className="text-[#999] hover:text-[#111] mt-2">
          <X size={15} />
        </button>
      </div>
      {error && <p className="text-xs text-red-600 mt-2 flex items-center gap-1.5"><AlertCircle size={11} /> {error}</p>}
    </div>
  );
}

// ─── Invoice Hours Modal ───────────────────────────────────────────────────────
function InvoiceHoursModal({
  projectId,
  scopes,
  onClose,
  onCreated,
}: {
  projectId: string;
  scopes: Scope[];
  onClose: () => void;
  onCreated: (invoiceId: string) => void;
}) {
  type LineState = { checked: boolean; hours: string };

  const initialLines = Object.fromEntries(
    scopes.map((sc) => {
      const billed = sc.invoiceLines.reduce((s, l) => s + l.quantity, 0);
      const unbilled = Math.max(sc.estimatedHours - billed, 0);
      return [sc.id, { checked: unbilled > 0, hours: unbilled > 0 ? String(unbilled) : "" } as LineState];
    }),
  );

  const [lines, setLines] = useState<Record<string, LineState>>(initialLines);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use ratePerHour if set, fall back to costPerHour so cost-only scopes are still billable
  const effectiveRate = (sc: Scope) => sc.ratePerHour ?? sc.costPerHour ?? null;
  const billableScopes = scopes.filter((sc) => effectiveRate(sc) !== null);
  const noRateScopes = scopes.filter((sc) => effectiveRate(sc) === null);

  const total = billableScopes.reduce((sum, sc) => {
    const l = lines[sc.id];
    if (!l?.checked || !l.hours) return sum;
    return sum + parseFloat(l.hours) * (effectiveRate(sc) ?? 0);
  }, 0);

  function setLine(id: string, patch: Partial<LineState>) {
    setLines((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  async function handleCreate() {
    const payload = billableScopes
      .filter((sc) => lines[sc.id]?.checked && parseFloat(lines[sc.id]?.hours ?? "0") > 0)
      .map((sc) => ({
        scopeId: sc.id,
        description: sc.name,
        hours: parseFloat(lines[sc.id].hours),
        ratePerHour: effectiveRate(sc)!,
      }));

    if (payload.length === 0) { setError("Select at least one scope with hours"); return; }

    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/invoices/from-scopes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines: payload }),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        setError(b?.error ?? "Failed to create invoice");
        return;
      }
      const { invoiceId } = await res.json();
      onCreated(invoiceId);
    } catch { setError("Network error"); } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#F0EEE9] flex items-center justify-between">
          <h2 className="text-base font-semibold text-[#111]">Invoice Service Hours</h2>
          <button onClick={onClose} className="text-[#999] hover:text-[#111]">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-3">
          {noRateScopes.length > 0 && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              {noRateScopes.length} scope{noRateScopes.length > 1 ? "s" : ""} have no rate — pull from BOM to set rates.
            </p>
          )}

          {billableScopes.length === 0 ? (
            <p className="text-sm text-[#999] text-center py-8">
              No scopes with rates. Pull SERVICE items from a BOM first.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#F0EEE9]">
                  <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-[#999] pb-2 w-6" />
                  <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-[#999] pb-2">Scope</th>
                  <th className="text-right text-[10px] font-semibold uppercase tracking-widest text-[#999] pb-2">Rate</th>
                  <th className="text-right text-[10px] font-semibold uppercase tracking-widest text-[#999] pb-2">Est</th>
                  <th className="text-right text-[10px] font-semibold uppercase tracking-widest text-[#999] pb-2">Actual</th>
                  <th className="text-right text-[10px] font-semibold uppercase tracking-widest text-[#999] pb-2">Billed</th>
                  <th className="text-right text-[10px] font-semibold uppercase tracking-widest text-[#999] pb-2 w-24">Bill hrs</th>
                  <th className="text-right text-[10px] font-semibold uppercase tracking-widest text-[#999] pb-2 w-24">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F7F6F3]">
                {billableScopes.map((sc) => {
                  const actual = sc.timeEntries.reduce((s, t) => s + t.hours, 0);
                  const billed = sc.invoiceLines.reduce((s, l) => s + l.quantity, 0);
                  const l = lines[sc.id];
                  const hrs = parseFloat(l?.hours ?? "0") || 0;
                  const rate = effectiveRate(sc) ?? 0;
                  const lineTotal = l?.checked ? hrs * rate : 0;

                  return (
                    <tr key={sc.id} className="hover:bg-[#FAFAF9]">
                      <td className="py-3 pr-2">
                        <input
                          type="checkbox"
                          checked={l?.checked ?? false}
                          onChange={(e) => setLine(sc.id, { checked: e.target.checked })}
                          className="rounded"
                        />
                      </td>
                      <td className="py-3 pr-4">
                        <p className="font-medium text-[#111]">{sc.name}</p>
                        {sc.item && <p className="text-[10px] font-mono text-[#999]">{sc.item.itemNumber}</p>}
                      </td>
                      <td className="py-3 text-right text-[#666]">
                        ${rate}/hr
                        {!sc.ratePerHour && sc.costPerHour && (
                          <span className="block text-[10px] text-amber-600">cost rate</span>
                        )}
                      </td>
                      <td className="py-3 text-right text-[#666]">{sc.estimatedHours}h</td>
                      <td className={`py-3 text-right font-medium ${actual > sc.estimatedHours ? "text-red-600" : "text-[#333]"}`}>
                        {actual.toFixed(1)}h
                      </td>
                      <td className="py-3 text-right text-[#666]">{billed.toFixed(1)}h</td>
                      <td className="py-3 text-right">
                        <input
                          type="number"
                          min={0}
                          step={0.5}
                          value={l?.hours ?? ""}
                          onChange={(e) => setLine(sc.id, { hours: e.target.value, checked: parseFloat(e.target.value) > 0 })}
                          disabled={!l?.checked}
                          placeholder="0"
                          className="w-20 text-right text-sm border border-[#E5E3DE] rounded-lg px-2 py-1 focus:outline-none focus:border-[#111] disabled:opacity-40"
                        />
                      </td>
                      <td className="py-3 text-right font-semibold text-[#111]">
                        {l?.checked && hrs > 0 ? `$${fmt(lineTotal)}` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#F0EEE9] flex items-center justify-between">
          <div>
            {total > 0 && (
              <p className="text-sm font-semibold text-[#111]">Total: ${fmt(total)}</p>
            )}
            {error && <p className="text-xs text-red-600 flex items-center gap-1.5"><AlertCircle size={11} /> {error}</p>}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="text-sm px-4 py-2 rounded-xl border border-[#E5E3DE] hover:bg-[#F7F6F3]"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={saving || total === 0}
              className="text-sm font-semibold px-4 py-2 rounded-xl bg-[#111] text-white hover:bg-[#333] disabled:opacity-40"
            >
              {saving ? "Creating…" : "Create Invoice"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
