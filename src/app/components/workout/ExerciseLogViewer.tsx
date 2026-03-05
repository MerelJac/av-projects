import { renderPrescribed } from "@/app/utils/workoutFunctions";
import { Prescribed } from "@/types/prescribed";
import { ExerciseLog } from "@/types/workout";

const setRowCls = "flex items-center gap-3 bg-white rounded-xl px-3 py-2.5";
const setLabelCls = "text-xs font-semibold text-muted w-10 flex-shrink-0";
const setValCls = "text-sm text-foreground";
const setUnitCls = "text-xs text-muted";

export function ExerciseLogViewer({ logs }: { logs: ExerciseLog[] }) {
  return (
    <ul className="space-y-3">
      {logs.map((log, index) => (
        <li
          key={`${log.id}-${index}`}
          className="bg-white border border-surface2 rounded-2xl p-4 space-y-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <h4 className="font-syne font-bold text-sm text-foreground">
              {log.exerciseName ?? "Exercise"}
            </h4>
            <div className="flex items-center gap-2">
              {log.substitutedFrom && (
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full text-secondary-color bg-secondary-color/10">
                  Substituted
                </span>
              )}
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full text-[#3dffa0] bg-[#3dffa0]/10">
                Logged
              </span>
            </div>
          </div>

          {/* Prescribed */}
          <div className="flex items-center gap-2 bg-secondary-color/5 border border-secondary-color/15 rounded-xl px-3 py-2">
            <span className="text-[10px] font-semibold tracking-widest uppercase text-secondary-color/70">
              Prescribed
            </span>
            <span className="text-sm text-foreground/80">
              {log.prescribed ? renderPrescribed(log.prescribed as Prescribed) : "N/A"}
            </span>
          </div>

          {/* Performed */}
          <div className="space-y-2">
            <p className="text-[10px] font-semibold tracking-widest uppercase text-muted">
              Performed
            </p>

            {/* Timed */}
            {log.performed?.kind === "timed" && (
              <div className={setRowCls}>
                <span className={setLabelCls}>Time</span>
                <span className={setValCls}>{log.performed.duration}</span>
                <span className={setUnitCls}>seconds</span>
              </div>
            )}

            {/* Strength */}
            {log.performed?.kind === "strength" && (
              <div className="space-y-2">
                {log.performed.sets.map((set, i) => (
                  <div key={i} className={setRowCls}>
                    <span className={setLabelCls}>S{i + 1}</span>
                    <span className={setValCls}>{set.reps}</span>
                    <span className={setUnitCls}>reps</span>
                    {set.weight != null && (
                      <>
                        <span className="text-muted text-xs">@</span>
                        <span className={setValCls}>{set.weight}</span>
                        <span className={setUnitCls}>lb</span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Hybrid */}
            {log.performed?.kind === "hybrid" && (
              <div className="space-y-2">
                {log.performed.sets.map((set, i) => (
                  <div key={i} className={setRowCls}>
                    <span className={setLabelCls}>S{i + 1}</span>
                    <span className={setValCls}>{set.reps}</span>
                    <span className={setUnitCls}>reps</span>
                    {set.weight != null && (
                      <>
                        <span className="text-muted text-xs">@</span>
                        <span className={setValCls}>{set.weight}</span>
                        <span className={setUnitCls}>lb</span>
                      </>
                    )}
                    {set.duration != null && (
                      <>
                        <span className="text-muted text-xs">·</span>
                        <span className={setValCls}>{set.duration}</span>
                        <span className={setUnitCls}>sec</span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Core & Mobility */}
            {(log.performed?.kind === "core" || log.performed?.kind === "mobility") && (
              <div className="space-y-2">
                {log.performed.sets.map((set, i) => (
                  <div key={i} className={setRowCls}>
                    <span className={setLabelCls}>S{i + 1}</span>
                    {set.reps != null && (
                      <>
                        <span className={setValCls}>{set.reps}</span>
                        <span className={setUnitCls}>reps</span>
                      </>
                    )}
                    {set.duration != null && (
                      <>
                        <span className="text-muted text-xs">·</span>
                        <span className={setValCls}>{set.duration}</span>
                        <span className={setUnitCls}>sec</span>
                      </>
                    )}
                    {set.weight != null && (
                      <>
                        <span className="text-muted text-xs">@</span>
                        <span className={setValCls}>{set.weight}</span>
                        <span className={setUnitCls}>lb</span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Bodyweight */}
            {log.performed?.kind === "bodyweight" && (
              <div className="space-y-2">
                {log.performed.sets.map((set, i) => (
                  <div key={i} className={setRowCls}>
                    <span className={setLabelCls}>S{i + 1}</span>
                    <span className={setValCls}>{set.reps}</span>
                    <span className={setUnitCls}>reps</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes / substitution reason */}
          {log.substitutionReason && (
            <div className="flex items-start gap-2 bg-secondary-color/5 border border-secondary-color/15 rounded-xl px-3 py-2.5">
              <span className="text-[10px] font-semibold tracking-widest uppercase text-secondary-color/70 mt-0.5 flex-shrink-0">
                Note
              </span>
              <p className="text-sm text-foreground/70 italic">{log.substitutionReason}</p>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}