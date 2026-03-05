"use client";

import { useState } from "react";
import {
  addBodyMetric,
  deleteClient,
} from "@/app/(team)/clients/[clientId]/actions";
import { TrainerClientProfile } from "@/types/client";
import {
  ScheduledWorkoutWithProgram,
  ScheduledWorkoutWithWorkout,
} from "@/types/workout";
import { ClientProfileEditor } from "./ClientProfileEditor";
import { BackButton } from "../BackButton";
import { useRouter } from "next/navigation";
import { AlertCircle, RotateCcw, Trash } from "lucide-react";
import WorkoutCalendarWeek from "../CalendarScheduledWorkout";
import { SyncProgramButton } from "../programs/SyncProgramButton";
import { formatDateFromInputReturnString } from "@/app/utils/format/formatDateFromInput";
import Link from "next/link";

export default function ClientProfile({
  client,
  scheduledWorkouts,
}: {
  client: TrainerClientProfile;
  scheduledWorkouts: ScheduledWorkoutWithWorkout[];
}) {
  type ProgramGroup = {
    program: {
      id: string;
      name: string;
    };
    workouts: ScheduledWorkoutWithProgram[];
  };
  const labelClass =
    "block text-[10px] font-semibold tracking-widest uppercase text-muted mb-1.5";

  const [weight, setWeight] = useState("");
  const [bodyFat, setBodyFat] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [activeStatusId, setActiveStatusId] = useState<string | null>(null);
  const [error, setError] = useState<string | null | undefined>(null);

  const router = useRouter();

  async function handleAddMetric() {
    await addBodyMetric(
      client.id,
      weight ? Number(weight) : null,
      bodyFat ? Number(bodyFat) : null,
    );

    setWeight("");
    setBodyFat("");
  }

  const programs = Object.values(
    client.scheduledWorkouts.reduce<Record<string, ProgramGroup>>((acc, sw) => {
      const program = sw.workout.program;
      // 🔒 Guard against null
      if (!program) return acc;

      if (!acc[program.id]) {
        acc[program.id] = {
          program: {
            id: program.id,
            name: program.name,
          },
          workouts: [],
        };
      }

      acc[program.id].workouts.push(sw);
      return acc;
    }, {}),
  );

  async function handleDeleteClient() {
    const confirmed = window.confirm(
      "Are you sure you want to delete this client?\n\nThis action is irreversible.",
    );

    if (!confirmed) return;

    setDeleting(true);
    setError(null);

    try {
      const result = await deleteClient(client.id);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      router.push("/clients");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete client");
      setDeleting(false);
    }
  }

  const handleChangeStatus = async (workoutId: string, status: string) => {
    setError(null);

    try {
      const res = await fetch(`/api/workouts/status/${workoutId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ newStatus: status }),
      });

      if (!res.ok) {
        throw new Error("Failed to update status");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change status");
    }
  };
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header with back + name */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <BackButton route={"/clients"} />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="nav-logo">
            {client.profile?.firstName} {client.profile?.lastName}
          </h1>
          <span className="text-gray-500 font-normal text-xl md:ml-3">
            {client.email}
          </span>
        </div>
      </div>

      {/* Profile editor */}
      <ClientProfileEditor
        clientId={client.id}
        firstName={client.profile?.firstName}
        lastName={client.profile?.lastName}
        dob={client.profile?.dob}
        experience={client.profile?.experience}
        injuryNotes={client.profile?.injuryNotes}
        phone={client.profile?.phone}
        email={client.email}
        role={client.role}
      />

      {/* Basic info */}
      <div className="space-y-0 divide-y divide-surface2 p-5 space-y-5">
        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="py-3.5">
            <p className={labelClass}>Joined</p>
            <p className="text-sm font-medium text-foreground">
              {new Date(client.createdAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          <div className="py-3.5">
            <p className={labelClass}>Waiver Signed</p>
            <p className="text-sm font-medium text-foreground">
              {" "}
              {client.profile?.waiverSignedAt ? (
                new Date(client.profile.waiverSignedAt).toLocaleDateString(
                  undefined,
                  {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  },
                )
              ) : (
                <>
                  <AlertCircle
                    size={16}
                    className="text-amber-500 cursor-help"
                  />

                  {/* Tooltip */}
                  <div
                    className="
          absolute left-1/2 top-full mt-2 -translate-x-1/2
          whitespace-nowrap
          rounded-md bg-gray-900 px-2 py-1
          text-xs text-white
          opacity-0 group-hover:opacity-100
          pointer-events-none
          transition
          z-50
        "
                  >
                    Waiver has not been signed
                  </div>
                </>
              )}
            </p>
          </div>
        </dl>
      </div>

      {/* Add metric form */}
      <div className="gradient-bg border border-surface2 rounded-2xl p-5 space-y-4 body-stats">
        <h2 className="font-syne font-bold text-base text-foreground">
          Log New Measurement
        </h2>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="min-w-[140px]">
            <label className="block text-[10px] font-semibold tracking-widest uppercase text-muted mb-1.5">
              Weight (lb)
            </label>
            <input
              type="number"
              step="0.1"
              placeholder="e.g. 172.5"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-surface2 rounded-xl text-foreground text-sm placeholder:text-muted focus:border-secondary-color/50 focus:ring-1 focus:ring-secondary-color/30 outline-none transition"
            />
          </div>
          <div className="min-w-[140px]">
            <label className="block text-[10px] font-semibold tracking-widest uppercase text-muted mb-1.5">
              Body Fat %
            </label>
            <input
              type="number"
              step="0.1"
              placeholder="e.g. 18.4"
              value={bodyFat}
              onChange={(e) => setBodyFat(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-surface2 rounded-xl text-foreground text-sm placeholder:text-muted focus:border-secondary-color/50 focus:ring-1 focus:ring-secondary-color/30 outline-none transition"
            />
          </div>
          <button
            onClick={handleAddMetric}
            disabled={!weight.trim() && !bodyFat.trim()}
            className="px-5 py-2.5 bg-secondary-color text-black font-syne font-bold text-sm rounded-xl hover:opacity-90 active:scale-[0.98] transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Add Measurement
          </button>
        </div>
      </div>

      {/* Metrics history */}
      <div className="gradient-bg border border-surface2 rounded-2xl overflow-hidden body-stats">
        <div className="px-5 py-4 border-b border-surface2 body-stat-flex ">
          <h2 className="font-syne font-bold text-base text-foreground">
            Progress History
          </h2>
        </div>
        {client.bodyMetrics.length === 0 ? (
          <p className="text-muted italic text-sm px-5 py-8 text-center">
            No measurements recorded yet.
          </p>
        ) : (
          <ul className="divide-y divide-surface2">
            {client.bodyMetrics.map((m) => (
              <li key={m.id} className="body-stat-flex ">
                <div className="body-stat-flex ">
                  <div>
                    <p className="bs-label">Weight</p>
                    <p className="bs-val">
                      {m.weight ? `${m.weight} lb` : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="bs-label">Body Fat</p>
                    <p className="bs-val">
                      {m.bodyFat ? `${m.bodyFat}%` : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="bs-label">Logged</p>
                    <p className="bs-val-sub-label">
                      {new Date(m.recordedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      {/* Assigned Programs */}
      <div className="gradient-bg border border-surface2 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-surface2">
          <h2 className="font-syne font-bold text-base text-foreground">
            Assigned Programs
          </h2>
        </div>
        {programs.length === 0 ? (
          <p className="text-muted italic text-sm px-5 py-8 text-center">
            No programs assigned yet.
          </p>
        ) : (
          <div className="divide-y divide-surface2">
            {programs.map(({ program, workouts }) => {
              const completed = workouts.filter(
                (w) => w.status === "COMPLETED",
              ).length;
              const total = workouts.length;
              const progress = total ? (completed / total) * 100 : 0;
              const isComplete = progress === 100;
              return (
                <div key={program.id} className="p-5 space-y-4">
                  <WorkoutCalendarWeek scheduledWorkouts={scheduledWorkouts} />
                  <SyncProgramButton
                    clientId={client.id}
                    programId={program.id}
                  />
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <h3 className="font-syne font-bold text-sm text-foreground">
                      {program.name}
                    </h3>
                    <span className="text-xs text-muted">
                      {completed} / {total} completed
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full gradient-bg2 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${progress}%`,
                        background: isComplete
                          ? "#3dffa0"
                          : "linear-gradient(90deg, #c8f135, #3dffa0)",
                      }}
                    />
                  </div>
                  {/* Workout list */}
                  <ul className="space-y-1">
                    {workouts.map((w) => {
                      const isDone = w.status === "COMPLETED";
                      const isSkipped = w.status === "SKIPPED";
                      const isInProgress = w.status === "IN_PROGRESS";

                      const icon = isDone
                        ? "✅"
                        : isSkipped
                          ? "⚠️"
                          : isInProgress
                            ? "🔄"
                            : "📅";
                      const iconBg = isDone
                        ? "bg-[#3dffa0]/10"
                        : isSkipped
                          ? "bg-danger/10"
                          : isInProgress
                            ? "bg-secondary-color/10"
                            : "bg-white";
                      const badgeClass = isDone
                        ? "text-[#3dffa0] bg-[#3dffa0]/10"
                        : isSkipped
                          ? "text-danger bg-danger/10"
                          : isInProgress
                            ? "text-secondary-color bg-secondary-color/10"
                            : "text-muted bg-white";

                      return (
                        <li
                          key={w.id}
                          className="flex items-center gap-3 bg-white border border-surface2 rounded-2xl px-4 py-3 transition-all active:scale-[0.98]"
                        >
                          {/* Icon */}
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0 ${iconBg}`}
                          >
                            {icon}
                          </div>

                          {/* Info — links to workout */}
                          <Link
                            href={`/view-workouts/${w.id}`}
                            className="flex-1 min-w-0 hover:text-secondary-color transition-colors"
                          >
                            <p className="text-sm font-medium text-foreground truncate">
                              {w.workout.name}
                            </p>
                            <p className="text-xs text-muted mt-0.5">
                              {formatDateFromInputReturnString(w.scheduledDate)}
                            </p>
                          </Link>

                          {/* Right side */}
                          {/* Right side */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span
                              className={`text-[11px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide ${badgeClass}`}
                            >
                              {w.status.replace(/_/g, " ")}
                            </span>

                            {activeStatusId === w.id ? (
                              <select
                                autoFocus
                                onChange={(e) => {
                                  handleChangeStatus(w.id, e.target.value);
                                  setActiveStatusId(null);
                                }}
                                onBlur={() => setActiveStatusId(null)}
                                defaultValue={w.status}
                                className="bg-white border border-secondary-color/30 rounded-xl px-3 py-1.5 text-xs text-foreground focus:border-secondary-color/50 outline-none transition"
                              >
                                <option value="SCHEDULED">Scheduled</option>
                                <option value="COMPLETED">Completed</option>
                                <option value="SKIPPED">Skipped</option>
                              </select>
                            ) : (
                              <button
                                onClick={() =>
                                  setActiveStatusId(
                                    activeStatusId === w.id ? null : w.id,
                                  )
                                }
                                className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-muted hover:text-secondary-color hover:bg-secondary-color/10 hover:border-secondary-color/20 border border-transparent transition-all"
                                title="Change status"
                              >
                                <RotateCcw size={11} />
                              </button>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Additional Activity */}
      <div className="gradient-bg border border-surface2 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-surface2">
          <h2 className="font-syne font-bold text-base text-foreground">
            Additional Activity
          </h2>
        </div>
        {client.additionalWorkouts.length === 0 ? (
          <p className="text-muted italic text-sm px-5 py-8 text-center">
            No additional activity logged.
          </p>
        ) : (
          <ul className="divide-y divide-surface2">
            {client.additionalWorkouts.map((w) => (
              <li
                key={w.id}
                className="flex justify-between items-center px-5 py-3.5"
              >
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-foreground">
                    {w.type.name}
                  </p>
                  <p className="text-xs text-muted">
                    {w.duration
                      ? `${w.duration} min`
                      : "Duration not specified"}
                    {w.distance != null && ` · ${w.distance} mi`}
                  </p>
                  {w.notes && (
                    <p className="text-xs text-muted italic">{w.notes}</p>
                  )}
                </div>
                <span className="text-xs text-muted">
                  {formatDateFromInputReturnString(w.performedAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Danger zone */}
      <div className="border border-danger/20 bg-danger/5 rounded-2xl p-5 space-y-3">
        <h2 className="text-[10px] font-semibold tracking-widest uppercase text-danger">
          Danger Zone
        </h2>
        <p className="text-sm text-muted">
          Deleting a client will permanently remove all workouts, metrics, and
          activity associated with this client.
        </p>
        <button
          onClick={handleDeleteClient}
          disabled={deleting}
          className="inline-flex items-center gap-2 rounded-xl bg-danger/10 border border-danger/20 px-4 py-2.5 text-sm font-semibold text-danger hover:bg-danger/20 transition active:scale-[0.98] disabled:opacity-50"
        >
          <Trash size={14} />
          {deleting ? "Deleting…" : "Delete Client"}
        </button>
      </div>

      {error && <p className="text-danger text-sm">{error}</p>}
    </div>
  );
}
