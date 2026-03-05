"use client";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { RescheduleWorkoutModal } from "./workout/RescheduleWorkoutModal";
import {
  formatDateFromInput,
  normalizeDate,
} from "../utils/format/formatDateFromInput";

export type CalendarScheduledWorkout = {
  id: string;
  scheduledDate: string | Date;
  status:
    | "SCHEDULED"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "SKIPPED"
    | "READY_TO_BUILD"
    | "BUILDING";
  workout: { id: string; name: string };
};

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const statusStyles: Record<
  string,
  { card: string; badge: string; label: string }
> = {
  COMPLETED: {
    card: "bg-[#3dffa0]/5 border-[#3dffa0]/20",
    badge: "text-[#3dffa0] bg-[#3dffa0]/10",
    label: "Done",
  },
  IN_PROGRESS: {
    card: "bg-lime-green/5 border-lime-green/20",
    badge: "text-lime-green bg-lime-green/10",
    label: "Active",
  },
  SKIPPED: {
    card: "bg-danger/5 border-danger/20",
    badge: "text-danger bg-danger/10",
    label: "Skipped",
  },
  SCHEDULED: {
    card: "bg-white border-surface2",
    badge: "text-muted bg-white",
    label: "Scheduled",
  },
  READY_TO_BUILD: {
    card: "bg-white border-surface2",
    badge: "text-muted bg-white",
    label: "Pending",
  },
  BUILDING: {
    card: "bg-white border-surface2",
    badge: "text-muted bg-white",
    label: "Building",
  },
};

export default function WorkoutCalendarWeek({
  scheduledWorkouts,
}: {
  scheduledWorkouts: CalendarScheduledWorkout[];
}) {
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const weekStart = useMemo(() => startOfWeek(currentDate), [currentDate]);
  const days = useMemo(
    () => Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i)),
    [weekStart],
  );
  const normalized = useMemo(
    () =>
      scheduledWorkouts.map((w) => ({
        ...w,
        scheduledDate: normalizeDate(w.scheduledDate),
      })),
    [scheduledWorkouts],
  );

  return (
    <div className="bg-white border border-surface2 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-surface2">
        <div>
          <p className="font-syne font-bold text-sm text-foreground">
            Week of{" "}
            {weekStart.toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentDate((d) => addDays(d, -7))}
            className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-muted hover:text-foreground transition-colors"
          >
            <ChevronLeft size={15} />
          </button>
          <button
            onClick={() => setCurrentDate((d) => addDays(d, 7))}
            className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-muted hover:text-foreground transition-colors"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {/* Day columns */}
      <div className="overflow-x-auto">
        <div className="grid grid-cols-7 min-w-[560px] md:min-w-0">
          {days.map((day, i) => {
            const workoutsForDay = normalized.filter((w) =>
              sameDay(w.scheduledDate as Date, day),
            );
            const isToday = sameDay(day, today);
            const isWeekend = i >= 5;

            return (
              <div
                key={day.toISOString()}
                className={`min-h-[140px] p-2.5 border-r border-surface2 last:border-r-0 ${
                  isWeekend ? "bg-white/40" : ""
                }`}
              >
                {/* Day label */}
                <div className={`text-center mb-2 ${isToday ? "" : ""}`}>
                  <p
                    className={`text-[10px] font-semibold uppercase tracking-widest ${
                      isToday ? "text-lime-green" : "text-muted"
                    }`}
                  >
                    {day.toLocaleDateString(undefined, { weekday: "short" })}
                  </p>
                  <p
                    className={`font-syne font-bold text-sm mt-0.5 ${
                      isToday
                        ? "text-lime-green bg-lime-green/10 w-6 h-6 rounded-full flex items-center justify-center mx-auto"
                        : "text-foreground/60"
                    }`}
                  >
                    {day.getDate()}
                  </p>
                </div>

                {/* Workouts */}
                <div className="space-y-1.5">
                  {workoutsForDay.length === 0 ? (
                    <p className="text-[10px] text-muted/40 text-center mt-3">
                      —
                    </p>
                  ) : (
                    workoutsForDay.map((w) => {
                      const style =
                        statusStyles[w.status] ?? statusStyles.SCHEDULED;
                      return (
                        <div
                          key={w.id}
                          className={`rounded-xl px-2 py-2 border flex flex-col gap-1 ${style.card}`}
                        >
                          <span className="text-[11px] font-semibold text-foreground truncate leading-tight">
                            {w.workout.name}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full self-start ${style.badge}`}
                          >
                            {style.label}
                          </span>
                          <button
                            onClick={() => setRescheduleId(w.id)}
                            className="text-[10px] text-muted hover:text-lime-green transition-colors text-left"
                          >
                            Reschedule →
                          </button>
                          {rescheduleId === w.id && (
                            <RescheduleWorkoutModal
                              scheduledWorkoutId={w.id}
                              currentDate={w.scheduledDate}
                              onClose={() => setRescheduleId(null)}
                            />
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
