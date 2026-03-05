import {
  logExercise,
  removeClientExercise,
} from "@/app/(client)/workouts/[scheduledWorkoutId]/actions";
import ExerciseModal from "@/app/components/exercise/ExerciseModal";
import { getPercentageForReps } from "@/app/utils/oneRepMax/getPercentageForReps";
import {
  buildPerformedFromPrescribed,
  renderPrescribed,
} from "@/app/utils/workoutFunctions";
import { Exercise } from "@/types/exercise";
import { Performed, Prescribed } from "@/types/prescribed";
import { Ellipsis, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import SubstitutionModal from "../exercise/SubstitutionModal";

export function ExerciseLogger({
  exercise,
  prescribed,
  performed,
  workoutLogId,
  clientId,
  sectionId,
  disabled,
  notes,
  status,
  isClientAdded = false,
  exerciseLogId,
  onChange,
}: {
  exercise: Exercise;
  prescribed: Prescribed;
  performed?: Performed;
  workoutLogId: string | null;
  clientId: string;
  sectionId?: string | undefined;
  disabled: boolean;
  notes?: string | null;
  status?: string;
  isClientAdded?: boolean;

  exerciseLogId?: string;
  onChange: (data: {
    exerciseId: string;
    prescribed: Prescribed;
    performed: Performed;
    note: string;
    sectionId?: string | null;
  }) => void;
}) {
  const router = useRouter();
  const [performedState, setPerformedState] = useState<Performed>(
    performed ?? buildPerformedFromPrescribed(prescribed),
  );
  const isBuilding = status === "BUILDING";
  const isInputDisabled = disabled || isBuilding;
  const [hasSaved, setHasSaved] = useState(false);
  const [openSubModal, setOpenSubModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [note, setNote] = useState("");
  const [openExerciseId, setOpenExerciseId] = useState<string | null>(null);
  const [oneRepMax, setOneRepMax] = useState<number | null>(null);

  function updatePerformed<K extends keyof Performed>(
    updater: (prev: Performed) => Performed,
  ) {
    setHasSaved(false);
    setPerformedState((prev) => updater(prev));
  }
  const performedRef = useRef(performed);
  const noteRef = useRef(note);
  const hasSavedRef = useRef(hasSaved);

  useEffect(() => {
    onChange({
      exerciseId: exercise.id,
      prescribed,
      performed: performedState,
      note,
      sectionId: sectionId ?? null,
    });
  }, [performedState, note]);

  useEffect(() => {
    performedRef.current = performed;
    noteRef.current = note;
    hasSavedRef.current = hasSaved;
  }, [performed, note, hasSaved]);

  const hasRegisteredRef = useRef(false);

  useEffect(() => {
    async function loadOneRepMax() {
      const res = await fetch(
        `/api/one-rep-max?clientId=${clientId}&exerciseId=${exercise.id}`,
      );
      const data = await res.json();
      setOneRepMax(data.oneRepMax);
    }

    loadOneRepMax();
  }, [clientId, exercise.id]);

  console.log("building status: ", status);
  console.log("isBuilding status: ", isBuilding);
  console.log("disabled status: ", disabled);

  console.log("isdisabled status: ", isInputDisabled);
  return (
    <div className="card">
      <div className="card-header">
        <span
          className="card-title"
          onClick={() => setOpenExerciseId(exercise.id)}
        >
          {exercise.name}
        </span>
        <div className="icon-btns">
          {/* Substitution */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpenSubModal(true);
            }}
            className="icon-btn"
          >
            <Ellipsis size={14} />
          </button>

          {isClientAdded && !isInputDisabled && (
            <button
              onClick={async (e) => {
                e.stopPropagation();
                if (!exerciseLogId || !workoutLogId) return;

                if (!confirm("Remove this exercise from your workout?")) return;

                await removeClientExercise(exerciseLogId);
                router.refresh();
              }}
              className="icon-btn danger"
            >
              🗑
            </button>
          )}
        </div>
      </div>

      {/* Prescribed */}
      <div className="prescribed">
        <span className="label">Prescribed:</span>{" "}
        {renderPrescribed(prescribed)}
      </div>

      {/* Logging UI */}
      {!isInputDisabled && (
        <div className="space-y-4">
          {/* Timed */}
          {prescribed.kind === "timed" && performedState.kind === "timed" && (
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium w-24 text-muted">
                Time
              </label>
              <input
                type="number"
                className="w-28 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={performedState.duration}
                onChange={(e) =>
                  updatePerformed(() => ({
                    kind: "timed",
                    duration: Number(e.target.value),
                  }))
                }
              />
              <span className="text-sm text-muted">seconds</span>
            </div>
          )}

          {/* Strength  */}
          {performedState.kind === "strength" && (
            <div className="space-y-2">
              {performedState.sets.map((set, index) => {
                const reps = set.reps;
                const recommendedWeight =
                  oneRepMax && reps
                    ? Math.round(oneRepMax * getPercentageForReps(reps))
                    : null;

                return (
                  <div
                    key={index}
                    className="bg-bg rounded-xl px-3 py-3 space-y-2"
                  >
                    <span className="text-xs font-semibold text-muted">
                      Set {index + 1}
                    </span>

                    <div className="grid grid-cols-2 gap-2">
                      {/* Reps */}
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] uppercase tracking-widest font-semibold text-muted">
                          Reps
                        </span>
                        <input
                          type="number"
                          value={set.reps}
                          className="w-full bg-white border border-surface2 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-lime-green/50 outline-none"
                          onChange={(e) => {
                            setHasSaved(false);
                            setPerformedState((prev) => {
                              if (prev.kind !== "strength") return prev;
                              const sets = [...prev.sets];
                              sets[index] = {
                                ...sets[index],
                                reps: Number(e.target.value),
                              };
                              return { ...prev, sets };
                            });
                          }}
                        />
                      </div>

                      {/* Weight */}
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] uppercase tracking-widest font-semibold text-muted">
                          lb{" "}
                          {recommendedWeight && (
                            <span className="normal-case tracking-normal font-normal text-muted/60">
                              (rec: {recommendedWeight})
                            </span>
                          )}
                        </span>
                        <input
                          type="number"
                          value={set.weight ?? ""}
                          placeholder={
                            recommendedWeight ? `${recommendedWeight}` : "—"
                          }
                          className="w-full bg-white border border-surface2 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-lime-green/50 outline-none"
                          onFocus={() => {
                            if (!set.weight && recommendedWeight) {
                              setHasSaved(false);
                              setPerformedState((prev) => {
                                if (prev.kind !== "strength") return prev;
                                const sets = [...prev.sets];
                                sets[index] = {
                                  ...sets[index],
                                  weight: recommendedWeight,
                                };
                                return { ...prev, sets };
                              });
                            }
                          }}
                          onChange={(e) => {
                            setHasSaved(false);
                            setPerformedState((prev) => {
                              if (prev.kind !== "strength") return prev;
                              const sets = [...prev.sets];
                              sets[index] = {
                                ...sets[index],
                                weight: e.target.value
                                  ? Number(e.target.value)
                                  : null,
                              };
                              return { ...prev, sets };
                            });
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Hybrid */}
          {performedState.kind === "hybrid" && (
            <div className="space-y-2">
              {performedState.sets.map((set, index) => {
                const reps = set.reps;
                const recommendedWeight =
                  oneRepMax && reps
                    ? Math.round(oneRepMax * getPercentageForReps(reps))
                    : null;

                return (
                  <div
                    key={index}
                    className="bg-bg rounded-xl px-3 py-3 space-y-2"
                  >
                    <span className="text-xs font-semibold text-muted">
                      Set {index + 1}
                    </span>

                    <div className="grid grid-cols-3 gap-2">
                      {/* Reps */}
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] uppercase tracking-widest font-semibold text-muted">
                          Reps
                        </span>
                        <input
                          type="number"
                          value={set.reps}
                          className="w-full bg-white border border-surface2 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-lime-green/50 outline-none"
                          onChange={(e) => {
                            setHasSaved(false);
                            setPerformedState((prev) => {
                              if (prev.kind !== "hybrid") return prev;
                              const sets = [...prev.sets];
                              sets[index] = {
                                ...sets[index],
                                reps: Number(e.target.value),
                              };
                              return { ...prev, sets };
                            });
                          }}
                        />
                      </div>

                      {/* Weight */}
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] uppercase tracking-widest font-semibold text-muted">
                          lb
                        </span>
                        <input
                          type="number"
                          value={set.weight ?? ""}
                          placeholder={
                            recommendedWeight ? `${recommendedWeight}` : "—"
                          }
                          className="w-full bg-white border border-surface2 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-lime-green/50 outline-none"
                          onFocus={() => {
                            if (!set.weight && recommendedWeight) {
                              setHasSaved(false);
                              setPerformedState((prev) => {
                                if (prev.kind !== "hybrid") return prev;
                                const sets = [...prev.sets];
                                sets[index] = {
                                  ...sets[index],
                                  weight: recommendedWeight,
                                };
                                return { ...prev, sets };
                              });
                            }
                          }}
                          onChange={(e) => {
                            setHasSaved(false);
                            setPerformedState((prev) => {
                              if (prev.kind !== "hybrid") return prev;
                              const sets = [...prev.sets];
                              sets[index] = {
                                ...sets[index],
                                weight: e.target.value
                                  ? Number(e.target.value)
                                  : null,
                              };
                              return { ...prev, sets };
                            });
                          }}
                        />
                      </div>

                      {/* Duration */}
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] uppercase tracking-widest font-semibold text-muted">
                          Sec
                        </span>
                        <input
                          type="number"
                          value={set.duration ?? ""}
                          placeholder="—"
                          className="w-full bg-white border border-surface2 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-lime-green/50 outline-none"
                          onChange={(e) => {
                            setHasSaved(false);
                            setPerformedState((prev) => {
                              if (prev.kind !== "hybrid") return prev;
                              const sets = [...prev.sets];
                              sets[index] = {
                                ...sets[index],
                                duration: e.target.value
                                  ? Number(e.target.value)
                                  : 0,
                              };
                              return { ...prev, sets };
                            });
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* CORE & MOBILITY */}
          {(performedState.kind === "core" ||
            performedState.kind === "mobility") && (
            <div className="space-y-3">
              {/* Sets */}
              <div className="space-y-2">
                {(() => {
                  const firstDuration = performedState.sets[0]?.duration;
                  const sameDuration =
                    firstDuration != null &&
                    performedState.sets.every(
                      (s) => s.duration === firstDuration,
                    );

                  return performedState.sets.map((set, index) => (
                    <div
                      key={index}
                      className="bg-bg rounded-xl px-3 py-3 space-y-2"
                    >
                      <span className="text-xs font-semibold text-muted">
                        Set {index + 1}
                      </span>

                      <div className="grid grid-cols-3 gap-2">
                        {/* Reps */}
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] uppercase tracking-widest font-semibold text-muted">
                            Reps
                          </span>
                          <input
                            type="number"
                            value={set.reps ?? ""}
                            placeholder="—"
                            className="w-full bg-white border border-surface2 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-lime-green/50 outline-none"
                            onChange={(e) => {
                              setHasSaved(false);
                              setPerformedState((prev) => {
                                if (
                                  prev.kind !== "core" &&
                                  prev.kind !== "mobility"
                                )
                                  return prev;
                                const sets = [...prev.sets];
                                sets[index] = {
                                  ...sets[index],
                                  reps: e.target.value
                                    ? Number(e.target.value)
                                    : 0,
                                };
                                return { ...prev, sets };
                              });
                            }}
                          />
                        </div>

                        {/* Weight */}
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] uppercase tracking-widest font-semibold text-muted">
                            lb
                          </span>
                          <input
                            type="number"
                            value={set.weight ?? ""}
                            placeholder="bw"
                            className="w-full bg-white border border-surface2 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-lime-green/50 outline-none"
                            onChange={(e) => {
                              setHasSaved(false);
                              setPerformedState((prev) => {
                                if (
                                  prev.kind !== "core" &&
                                  prev.kind !== "mobility"
                                )
                                  return prev;
                                const sets = [...prev.sets];
                                sets[index] = {
                                  ...sets[index],
                                  weight: e.target.value
                                    ? Number(e.target.value)
                                    : null,
                                };
                                return { ...prev, sets };
                              });
                            }}
                          />
                        </div>

                        {/* Duration */}
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] uppercase tracking-widest font-semibold text-muted">
                            Sec
                          </span>
                          <input
                            type="number"
                            value={set.duration ?? ""}
                            placeholder="—"
                            className="w-full bg-white border border-surface2 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-lime-green/50 outline-none"
                            onChange={(e) => {
                              setHasSaved(false);
                              setPerformedState((prev) => {
                                if (
                                  prev.kind !== "core" &&
                                  prev.kind !== "mobility"
                                )
                                  return prev;
                                const sets = [...prev.sets];
                                sets[index] = {
                                  ...sets[index],
                                  duration: e.target.value
                                    ? Number(e.target.value)
                                    : 0,
                                };
                                return { ...prev, sets };
                              });
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}

          {/* Bodyweight */}
          {performedState.kind === "bodyweight" && (
            <div className="space-y-2">
              {performedState.sets.map((set, index) => (
                <div
                  key={index}
                  className="bg-bg rounded-xl px-3 py-3 space-y-2"
                >
                  <span className="text-xs font-semibold text-muted">
                    Set {index + 1}
                  </span>

                  <div className="grid grid-cols-1 gap-2 max-w-[120px]">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] uppercase tracking-widest font-semibold text-muted">
                        Reps
                      </span>
                      <input
                        type="number"
                        value={set.reps}
                        className="w-full bg-white border border-surface2 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-lime-green/50 outline-none"
                        onChange={(e) => {
                          setHasSaved(false);
                          setPerformedState((prev) => {
                            if (prev.kind !== "bodyweight") return prev;
                            const sets = [...prev.sets];
                            sets[index] = { reps: Number(e.target.value) };
                            return { kind: "bodyweight", sets };
                          });
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Notes */}
          <input
            placeholder="Notes (optional)"
            className="notes-input"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          {notes && (
            <div className="coach-notes">
              <span className="cn-label">Coach</span>
              <span className="cn-text">{notes}</span>
            </div>
          )}

          {/* Save */}
          <div className="pt-1">
            <button
              disabled={isSaving}
              className={`btn-save ${hasSaved ? "saved" : "unsaved"}`}
              onClick={async () => {
                if (!workoutLogId) return;

                setIsSaving(true);

                await logExercise(
                  workoutLogId,
                  exercise.id,
                  prescribed,
                  performedState,
                  note,
                  sectionId,
                );

                setIsSaving(false);
                setHasSaved(true);
                hasSavedRef.current = true;
              }}
            >
              {hasSaved ? "Saved ✓" : "Save"}
            </button>
          </div>
        </div>
      )}

      {/* Exercise info Modal */}
      {openExerciseId && (
        <ExerciseModal
          exerciseId={openExerciseId}
          clientId={clientId}
          onClose={() => setOpenExerciseId(null)}
        />
      )}

      {/* Substitution modal */}
      {openSubModal && workoutLogId && (
        <SubstitutionModal
          exerciseId={exercise.id}
          workoutLogId={workoutLogId}
          sectionId={sectionId}
          prescribed={prescribed}
          onClose={() => setOpenSubModal(false)}
        />
      )}
    </div>
  );
}
