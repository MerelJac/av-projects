import { prisma } from "@/lib/prisma";
import { Clock, User, TrendingUp, AlertTriangle, Briefcase, Hourglass } from "lucide-react";
import Link from "next/link";

function userName(user: { email: string; profile: { firstName: string; lastName: string } | null }) {
  if (user.profile) return `${user.profile.firstName} ${user.profile.lastName}`.trim();
  return user.email;
}

function BurnBar({ logged, estimated }: { logged: number; estimated: number }) {
  if (estimated === 0) return <span className="text-[10px] text-[#bbb]">No estimate</span>;
  const pct = Math.min((logged / estimated) * 100, 100);
  const over = logged > estimated;
  const remaining = Math.max(estimated - logged, 0);
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <div className="w-20 h-1.5 bg-[#F0EEE9] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${over ? "bg-red-400" : pct > 80 ? "bg-amber-400" : "bg-green-500"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className={`text-[11px] font-mono font-semibold ${over ? "text-red-500" : "text-[#888]"}`}>
          {logged.toFixed(1)}/{estimated}h
        </span>
      </div>
      {!over && remaining > 0 && (
        <span className="text-[10px] font-semibold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded-full whitespace-nowrap">
          {remaining.toFixed(1)}h left
        </span>
      )}
      {over && (
        <span className="text-[10px] font-semibold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full whitespace-nowrap">
          +{(logged - estimated).toFixed(1)}h over
        </span>
      )}
    </div>
  );
}

export default async function TimePage() {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const [entries, projects] = await Promise.all([
    prisma.timeEntry.findMany({
      include: {
        project: { select: { id: true, name: true } },
        user: { include: { profile: true } },
        scope: { select: { id: true, name: true, estimatedHours: true } },
      },
      orderBy: { date: "desc" },
    }),
    prisma.project.findMany({
      select: {
        id: true,
        name: true,
        customer: { select: { name: true } },
        scopes: {
          select: {
            id: true,
            name: true,
            estimatedHours: true,
            item: { select: { itemNumber: true } },
            timeEntries: {
              select: { id: true, hours: true, date: true, notes: true, user: { include: { profile: true } } },
              orderBy: { date: "desc" },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const totalHours = entries.reduce((s, e) => s + e.hours, 0);
  const weekHours = entries
    .filter(e => new Date(e.date) >= startOfWeek)
    .reduce((s, e) => s + e.hours, 0);

  // Per-user totals
  const byUser = new Map<string, { name: string; hours: number }>();
  for (const e of entries) {
    const existing = byUser.get(e.userId);
    if (existing) existing.hours += e.hours;
    else byUser.set(e.userId, { name: userName(e.user), hours: e.hours });
  }
  const topUsers = [...byUser.values()].sort((a, b) => b.hours - a.hours).slice(0, 4);

  // Over-budget scopes
  const overBudget = projects.flatMap(p =>
    p.scopes
      .filter(sc => sc.estimatedHours > 0 && sc.timeEntries.reduce((s, e) => s + e.hours, 0) > sc.estimatedHours)
      .map(sc => ({
        project: p.name,
        projectId: p.id,
        scope: sc.name,
        logged: sc.timeEntries.reduce((s, e) => s + e.hours, 0),
        estimated: sc.estimatedHours,
      }))
  );

  // Total hours remaining across all scopes
  const totalEstimated = projects.flatMap(p => p.scopes).reduce((s, sc) => s + sc.estimatedHours, 0);
  const totalRemaining = Math.max(totalEstimated - totalHours, 0);

  // Upcoming work: scopes with hours still remaining, sorted by most remaining first
  const upcomingScopes = projects.flatMap(p =>
    p.scopes
      .filter(sc => sc.estimatedHours > 0)
      .map(sc => {
        const logged = sc.timeEntries.reduce((s, e) => s + e.hours, 0);
        const remaining = sc.estimatedHours - logged;
        return { projectId: p.id, project: p.name, customer: p.customer.name, scope: sc.name, logged, estimated: sc.estimatedHours, remaining };
      })
      .filter(sc => sc.remaining > 0)
  ).sort((a, b) => b.remaining - a.remaining).slice(0, 8);

  return (
    <div className="bg-[#F7F6F3]">
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">

        <div>
          <h1 className="text-2xl font-bold text-[#111] tracking-tight">Time Tracking</h1>
          <p className="text-sm text-[#888] mt-0.5">Hours logged across all projects and scopes</p>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white border border-[#E5E3DE] rounded-2xl p-5">
            <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center mb-3">
              <Clock size={15} className="text-violet-500" />
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#999] mb-1">Total Logged</p>
            <p className="text-2xl font-bold text-[#111]">{totalHours.toFixed(1)}h</p>
          </div>

          <div className="bg-white border border-[#E5E3DE] rounded-2xl p-5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center mb-3">
              <TrendingUp size={15} className="text-blue-500" />
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#999] mb-1">This Week</p>
            <p className="text-2xl font-bold text-[#111]">{weekHours.toFixed(1)}h</p>
          </div>

          <div className="bg-white border border-[#E5E3DE] rounded-2xl p-5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center mb-3">
              <Hourglass size={15} className="text-blue-500" />
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#999] mb-1">Hours Left</p>
            <p className="text-2xl font-bold text-[#111]">{totalRemaining.toFixed(1)}h</p>
            {totalEstimated > 0 && (
              <p className="text-[10px] text-[#aaa] mt-0.5">of {totalEstimated}h scoped</p>
            )}
          </div>

          <div className="bg-white border border-[#E5E3DE] rounded-2xl p-5">
            <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center mb-3">
              <Briefcase size={15} className="text-green-500" />
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#999] mb-1">Projects</p>
            <p className="text-2xl font-bold text-[#111]">{projects.filter(p => p.scopes.some(s => s.timeEntries.length > 0)).length}</p>
          </div>

          <div className={`border rounded-2xl p-5 ${overBudget.length > 0 ? "bg-red-50 border-red-200" : "bg-white border-[#E5E3DE]"}`}>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-3 ${overBudget.length > 0 ? "bg-red-100" : "bg-[#F0EEE9]"}`}>
              <AlertTriangle size={15} className={overBudget.length > 0 ? "text-red-500" : "text-[#999]"} />
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#999] mb-1">Over Budget</p>
            <p className={`text-2xl font-bold ${overBudget.length > 0 ? "text-red-600" : "text-[#111]"}`}>{overBudget.length}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Projects + Scopes */}
          <div className="lg:col-span-2 space-y-4">
            {projects.map(project => {
              const projectLogged = project.scopes.reduce(
                (s, sc) => s + sc.timeEntries.reduce((a, e) => a + e.hours, 0), 0
              );
              const projectEstimated = project.scopes.reduce((s, sc) => s + sc.estimatedHours, 0);
              const projectRemaining = Math.max(projectEstimated - projectLogged, 0);
              if (project.scopes.every(sc => sc.timeEntries.length === 0)) return null;

              return (
                <div key={project.id} className="bg-white border border-[#E5E3DE] rounded-2xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-[#F0EEE9] flex items-center justify-between">
                    <div>
                      <Link href={`/projects/${project.id}`} className="text-sm font-bold text-[#111] hover:underline">
                        {project.name}
                      </Link>
                      <p className="text-[11px] text-[#aaa] mt-0.5">{project.customer.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[#111]">{projectLogged.toFixed(1)}h logged</p>
                      {projectEstimated > 0 && (
                        <p className={`text-[11px] mt-0.5 font-semibold ${projectRemaining === 0 ? "text-amber-500" : "text-blue-500"}`}>
                          {projectRemaining > 0 ? `${projectRemaining.toFixed(1)}h remaining` : "fully burned"}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="divide-y divide-[#F7F6F3]">
                    {project.scopes.filter(sc => sc.timeEntries.length > 0).map(sc => {
                      const logged = sc.timeEntries.reduce((s, e) => s + e.hours, 0);
                      return (
                        <div key={sc.id}>
                          <div className="px-5 py-3 bg-[#FAFAF9]">
                            <div className="flex items-center justify-between gap-4 flex-wrap">
                              <div className="min-w-0">
                                {sc.item && (
                                  <span className="text-[10px] font-mono font-semibold text-[#999] mr-2">
                                    {sc.item.itemNumber}
                                  </span>
                                )}
                                <span className="text-xs font-semibold text-[#444]">{sc.name}</span>
                              </div>
                              <BurnBar logged={logged} estimated={sc.estimatedHours} />
                            </div>
                          </div>
                          <div className="divide-y divide-[#F7F6F3]">
                            {sc.timeEntries.map(entry => (
                              <div key={entry.id} className="px-5 py-2.5 flex items-center gap-3 hover:bg-[#FAFAF9] transition-colors">
                                <div className="w-6 h-6 rounded-full bg-[#F0EEE9] flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-[#888]">
                                  {userName(entry.user)[0]?.toUpperCase() ?? "?"}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold text-[#333]">{userName(entry.user)}</span>
                                    {entry.notes && (
                                      <span className="text-[11px] text-[#999] truncate">{entry.notes}</span>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="text-xs font-mono font-semibold text-[#111]">{entry.hours}h</p>
                                  <p className="text-[10px] text-[#bbb]">
                                    {new Date(entry.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right sidebar */}
          <div className="space-y-5">

            {/* Upcoming Work */}
            <div className="bg-white border border-[#E5E3DE] rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#F0EEE9] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Hourglass size={13} className="text-blue-400" />
                  <h3 className="text-sm font-bold text-[#111]">Upcoming Work</h3>
                </div>
                <span className="text-xs font-mono font-bold text-blue-500">{totalRemaining.toFixed(1)}h left</span>
              </div>
              <div className="divide-y divide-[#F7F6F3]">
                {upcomingScopes.length === 0 && (
                  <p className="px-5 py-8 text-sm text-[#bbb] text-center">All scopes fully burned</p>
                )}
                {upcomingScopes.map((sc, i) => {
                  const pct = (sc.logged / sc.estimated) * 100;
                  return (
                    <div key={i} className="px-5 py-3 hover:bg-[#FAFAF9] transition-colors">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="min-w-0">
                          <Link href={`/projects/${sc.projectId}`} className="text-xs font-semibold text-[#111] hover:underline truncate block">
                            {sc.project}
                          </Link>
                          <p className="text-[11px] text-[#aaa]">{sc.scope}</p>
                        </div>
                        <span className="text-xs font-mono font-bold text-blue-500 shrink-0">
                          {sc.remaining.toFixed(1)}h
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1 bg-[#F0EEE9] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${pct > 80 ? "bg-amber-400" : "bg-blue-300"}`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-[#bbb] shrink-0">{pct.toFixed(0)}% done</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top contributors */}
            <div className="bg-white border border-[#E5E3DE] rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#F0EEE9] flex items-center gap-2">
                <User size={13} className="text-[#999]" />
                <h3 className="text-sm font-bold text-[#111]">Top Contributors</h3>
              </div>
              <div className="divide-y divide-[#F7F6F3]">
                {topUsers.length === 0 && (
                  <p className="px-5 py-8 text-sm text-[#bbb] text-center">No entries yet</p>
                )}
                {topUsers.map((u, i) => (
                  <div key={u.name} className="px-5 py-3 flex items-center gap-3">
                    <span className="text-[11px] font-bold text-[#ccc] w-4">{i + 1}</span>
                    <div className="w-7 h-7 rounded-full bg-[#F0EEE9] flex items-center justify-center text-[11px] font-bold text-[#888]">
                      {u.name[0]?.toUpperCase()}
                    </div>
                    <span className="text-sm text-[#333] flex-1 truncate">{u.name}</span>
                    <span className="text-sm font-mono font-bold text-[#111]">{u.hours.toFixed(1)}h</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Over budget */}
            {overBudget.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-red-100 flex items-center gap-2">
                  <AlertTriangle size={13} className="text-red-500" />
                  <h3 className="text-sm font-bold text-red-700">Over Budget</h3>
                </div>
                <div className="divide-y divide-red-100">
                  {overBudget.map((ob, i) => (
                    <div key={i} className="px-5 py-3">
                      <Link href={`/projects/${ob.projectId}`} className="text-xs font-semibold text-[#111] hover:underline">
                        {ob.project}
                      </Link>
                      <p className="text-[11px] text-[#666]">{ob.scope}</p>
                      <p className="text-[11px] font-semibold text-red-500 mt-0.5">
                        {ob.logged.toFixed(1)}h logged · {ob.estimated}h est · <span className="text-red-600">+{(ob.logged - ob.estimated).toFixed(1)}h over</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent entries */}
            <div className="bg-white border border-[#E5E3DE] rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#F0EEE9] flex items-center gap-2">
                <Clock size={13} className="text-[#999]" />
                <h3 className="text-sm font-bold text-[#111]">Recent Entries</h3>
              </div>
              <div className="divide-y divide-[#F7F6F3]">
                {entries.map(e => (
                  <div key={e.id} className="px-5 py-2.5 flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#F0EEE9] flex items-center justify-center text-[10px] font-bold text-[#888] shrink-0">
                      {userName(e.user)[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#333] truncate">{e.project.name}</p>
                      <p className="text-[10px] text-[#aaa] truncate">{e.scope?.name ?? "General"} · {userName(e.user)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-mono font-semibold text-[#111]">{e.hours}h</p>
                      <p className="text-[10px] text-[#bbb]">
                        {new Date(e.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}