"use client";
import {
  useOptimistic,
  startTransition,
  useState,
  useEffect,
  useRef,
} from "react";
import {
  addWorkoutExercise,
  updateWorkoutName,
  deleteWorkoutExercise,
  updateWorkoutDay,
  createWorkoutSection,
  updateWorkoutSectionTitle,
  reorderWorkoutSections,
  moveWorkoutExercise,
  deleteWorkoutSection,
  reorderExercisesInSection,
} from "../(team)/programs/[programId]/actions";
import {
  SectionExercise,
  WorkoutSectionWithExercises,
  WorkoutWithSections,
} from "@/types/workout"; // ← update this type!
import { Exercise } from "@/types/exercise";
import { formatPrescribed } from "../utils/prescriptions/prescriptionFormatter";
import { WorkoutDay } from "@/types/enums";
import { Prescribed } from "@/types/prescribed";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronUp,
  Copy,
  Pencil,
  Plus,
  Trash2,
  Video,
} from "lucide-react";
import ExerciseModal from "./exercise/ExerciseModal";
import { ExerciseSearch } from "./workout/ExerciseSearch";

export default function WorkoutCard({
  workout,
  exercises,
  programId,
  onDelete,
  onDuplicate,
}: {
  workout: WorkoutWithSections;
  exercises: Exercise[];
  programId: string;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  const inputCls =
    "w-full px-3 py-2 bg-white border border-surface2 rounded-xl text-foreground text-sm placeholder:text-muted focus:border-secondary-color/50 focus:ring-1 focus:ring-secondary-color/30 outline-none transition";
  const labelCls =
    "block text-[10px] font-semibold tracking-widest uppercase text-muted mb-1.5";

  const router = useRouter();
  const [exerciseId, setExerciseId] = useState(exercises[0]?.id || "");
  const [showSearch, setShowSearch] = useState(false);

  const [sectionId, setSectionId] = useState("");
  const [error, setError] = useState<string | null | undefined>(null);
  const [collapsed, setCollapsed] = useState(false);

  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(10);
  const [weight, setWeight] = useState<number | null>(null);
  const [time, setTime] = useState<number | null>(null);
  const [notes, setNotes] = useState("");

  const [name, setName] = useState(workout.name);
  const [editing, setEditing] = useState(false);
  const [day, setDay] = useState<WorkoutDay>(workout.day);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [openExerciseId, setOpenExerciseId] = useState<string | null>(null);

  const [sectionTitles, setSectionTitles] = useState<Record<string, string>>(
    {},
  );
  const selectedExercise = exercises.find((e) => e.id === exerciseId);

  const showStrengthFields =
    selectedExercise?.type === "STRENGTH" ||
    selectedExercise?.type === "BODYWEIGHT";

  const showHybridFields = selectedExercise?.type === "HYBRID";

  const showTimedFields = selectedExercise?.type === "TIMED";

  const showCoreMobilityFields =
    selectedExercise?.type === "CORE" || selectedExercise?.type === "MOBILITY";

  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowSearch(false);
      }
    }

    if (showSearch) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSearch]);

  function normalizeSections(
    sections: WorkoutWithSections["workoutSections"],
  ): WorkoutSectionWithExercises[] {
    return sections.map((section) => ({
      id: section.id,
      title: section.title,
      order: section.order,
      exercises: section.exercises.map((we) => ({
        id: we.id,
        order: we.order,
        exerciseId: we.exercise?.id ?? "__missing__", // required
        exercise: we.exercise
          ? ({
              ...we.exercise,
            } as Exercise)
          : null,
        prescribed: we.prescribed as Prescribed | null,
        notes: we.notes,
      })),
    }));
  }

  // ── Optimistic updates for sections + nested exercises ──
  const [optimisticSections, updateOptimisticSections] = useOptimistic<
    WorkoutSectionWithExercises[],
    | {
        type: "add-exercise";
        sectionId: string;
        exercise: SectionExercise;
        exerciseId: string;
      }
    | { type: "remove-exercise"; exerciseId: string }
    | { type: "add-section"; section: WorkoutSectionWithExercises }
    | {
        type: "replace-section";
        tempId: string;
        section: WorkoutSectionWithExercises;
      }
    | { type: "update-section-title"; sectionId: string; title: string }
    | {
        type: "move-exercise";
        exerciseId: string;
        fromSectionId: string;
        toSectionId: string;
      }
    | {
        type: "reorder-sections";
        orderedSectionIds: string[];
      }
    | {
        type: "delete-section";
        sectionId: string;
      }
  >(normalizeSections(workout.workoutSections), (currentSections, action) => {
    switch (action.type) {
      case "replace-section":
        return currentSections.map((s) =>
          s.id === action.tempId ? action.section : s,
        );

      case "add-section":
        return [...currentSections, action.section];
      case "update-section-title":
        return currentSections.map((section) =>
          section.id === action.sectionId
            ? { ...section, title: action.title }
            : section,
        );

      case "reorder-sections":
        return action.orderedSectionIds.map((id, index) => ({
          ...currentSections.find((s) => s.id === id)!,
          order: index,
        }));

      case "add-exercise":
        return currentSections.map((section) =>
          section.id === action.sectionId
            ? {
                ...section,
                exercises: [...section.exercises, action.exercise],
              }
            : section,
        );

      case "remove-exercise":
        return currentSections.map((section) => ({
          ...section,
          exercises: section.exercises.filter(
            (e) => e.id !== action.exerciseId,
          ),
        }));

      case "delete-section": {
        const remaining = currentSections.filter(
          (s) => s.id !== action.sectionId,
        );

        // Reindex section order so UI stays consistent
        return remaining.map((s, index) => ({
          ...s,
          order: index,
        }));
      }

      case "move-exercise": {
        let movedExercise: SectionExercise | null = null;

        const withoutExercise = currentSections.map((section) => {
          if (section.id === action.fromSectionId) {
            const remaining = section.exercises.filter((e) => {
              if (e.id === action.exerciseId) {
                movedExercise = e;
                return false;
              }
              return true;
            });
            return { ...section, exercises: remaining };
          }
          return section;
        });

        if (!movedExercise) return currentSections;

        return withoutExercise.map((section) =>
          section.id === action.toSectionId
            ? {
                ...section,
                exercises: [...section.exercises, movedExercise!],
              }
            : section,
        );
      }

      default:
        return currentSections;
    }
  });

  useEffect(() => {
    if (!sectionId && workout.workoutSections?.length) {
      setSectionId(workout.workoutSections[0].id);
    }
  }, [workout.workoutSections, sectionId]);

  function saveName() {
    setEditing(false);
    setError(null);
    startTransition(async () => {
      const result = await updateWorkoutName(programId, workout.id, name);

      if (!result.ok) {
        setEditing(false);
        setError(result.error);
        return;
      }
    });
  }

  function saveDay(newDay: WorkoutDay) {
    setDay(newDay);
    setError(null);
    startTransition(async () => {
      const result = await updateWorkoutDay(programId, workout.id, newDay);
      if (!result.ok) {
        setEditing(false);
        setError(result.error);
        return;
      }
    });
  }

  const startEditSection = (sectionId: string) => {
    setEditingSectionId(sectionId);

    setSectionTitles((prev) => {
      if (prev[sectionId] !== undefined) return prev;

      const section = optimisticSections.find((s) => s.id === sectionId);
      if (!section) return prev;

      return {
        ...prev,
        [sectionId]: section.title,
      };
    });
  };
  async function handleAddExercise() {
    if (!exerciseId || !sectionId) return;

    const exercise = exercises.find((e) => e.id === exerciseId);
    if (!exercise) return;

    let prescribed: Prescribed;

    if (showTimedFields) {
      prescribed = { kind: "timed", duration: time ?? 0 };
    } else if (exercise.type === "BODYWEIGHT") {
      prescribed = { kind: "bodyweight", sets, reps };
    } else if (exercise.type === "HYBRID") {
      prescribed = { kind: "hybrid", sets, reps, weight, duration: time };
    } else if (exercise.type === "CORE") {
      prescribed = { kind: "core", sets, reps, weight, duration: time };
    } else if (exercise.type === "MOBILITY") {
      prescribed = { kind: "mobility", sets, reps, weight, duration: time };
    } else {
      // STRENGTH + fallback
      prescribed = { kind: "strength", sets, reps, weight };
    }

    // Optimistic shape should roughly match what your backend returns
    const optimisticExercise = {
      id: crypto.randomUUID(), // temporary id
      order:
        optimisticSections.find((s) => s.id === sectionId)?.exercises.length ??
        0,
      sectionId, // important for relation
      exercise, // full exercise object
      exerciseId,
      prescribed,
      notes: notes || null,
    };

    startTransition(() => {
      updateOptimisticSections({
        type: "add-exercise",
        sectionId,
        exerciseId,
        exercise: optimisticExercise,
      });
    });

    // Real server call
    try {
      setError(null);
      const result = await addWorkoutExercise(
        programId,
        workout.id,
        sectionId, // ← now required
        exerciseId,
        prescribed,
        notes.trim() || undefined,
      );
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setNotes(""); // clear only on success
    } catch (err) {
      console.error("Failed to add exercise", err);
      // TODO: rollback optimistic update (more advanced)
    }
  }

  async function handleDeleteExercise(workoutExerciseId: string) {
    startTransition(() => {
      updateOptimisticSections({
        type: "remove-exercise",
        exerciseId: workoutExerciseId,
      });
    });
    try {
      setError(null);
      const result = await deleteWorkoutExercise(programId, workoutExerciseId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
    } catch (err) {
      console.error("Delete failed", err);
      // TODO: revert optimistic state
    }
  }

  async function saveSectionTitle(sectionId: string, newTitle: string) {
    if (!newTitle.trim()) {
      // Optional: revert or show error
      return;
    }

    const trimmed = newTitle.trim();

    // Optimistic update
    startTransition(() => {
      updateOptimisticSections({
        type: "update-section-title",
        sectionId,
        title: trimmed,
      });
    });

    setEditingSectionId(null);

    try {
      setError(null);
      const result = await updateWorkoutSectionTitle(
        programId,
        sectionId,
        trimmed,
      );
      if (result && result.error) {
        setError(result.error);
        return;
      }
    } catch (err) {
      console.error("Failed to update section title", err);
      // TODO: rollback (advanced) or show toast/error
    }
  }

  async function handleAddSection() {
    const tempId = crypto.randomUUID();

    const optimisticSection: WorkoutSectionWithExercises = {
      id: tempId,
      title: "New Section",
      order: optimisticSections.length,
      exercises: [],
    };

    startTransition(() => {
      updateOptimisticSections({
        type: "add-section",
        section: optimisticSection,
      });
    });

    try {
      const realSection = await createWorkoutSection(
        programId,
        workout.id,
        "New Section",
      );

      if ("error" in realSection) {
        setError(realSection.error);
        startTransition(() => {
          updateOptimisticSections({
            type: "delete-section",
            sectionId: tempId,
          });
        });
        return;
      }

      startTransition(() => {
        updateOptimisticSections({
          type: "replace-section",
          tempId,
          section: {
            ...realSection,
            exercises: [],
          },
        });
      });

      setSectionId(realSection.id); // ✅ REAL ID
    } catch (err) {
      console.error("Failed to create section", err);

      startTransition(() => {
        updateOptimisticSections({
          type: "delete-section",
          sectionId: tempId,
        });
      });
    }
  }
  function moveSectionUp(sectionId: string) {
    const index = optimisticSections.findIndex((s) => s.id === sectionId);
    if (index <= 0) return;

    const reordered = [...optimisticSections];
    [reordered[index - 1], reordered[index]] = [
      reordered[index],
      reordered[index - 1],
    ];

    const ids = reordered.map((s) => s.id);

    startTransition(() => {
      updateOptimisticSections({
        type: "reorder-sections",
        orderedSectionIds: ids,
      });
    });

    reorderWorkoutSections(workout.id, ids);
    router.refresh();
  }

  function moveSectionDown(sectionId: string) {
    const index = optimisticSections.findIndex((s) => s.id === sectionId);
    if (index === -1 || index >= optimisticSections.length - 1) return;

    const reordered = [...optimisticSections];
    [reordered[index], reordered[index + 1]] = [
      reordered[index + 1],
      reordered[index],
    ];

    const ids = reordered.map((s) => s.id);

    startTransition(() => {
      updateOptimisticSections({
        type: "reorder-sections",
        orderedSectionIds: ids,
      });
    });

    reorderWorkoutSections(workout.id, ids);
    router.refresh();
  }

  function handleDeleteSection(sectionId: string) {
    const section = optimisticSections.find((s) => s.id === sectionId);
    if (!section) return;

    const confirmed = confirm(
      section.exercises.length > 0
        ? "Delete this section and all its exercises?"
        : "Delete this section?",
    );

    if (!confirmed) return;

    startTransition(() =>
      updateOptimisticSections({
        type: "delete-section",
        sectionId,
      }),
    );

    deleteWorkoutSection(programId, sectionId);
    router.refresh();
  }

  function moveExerciseWithinSection(
    sectionId: string,
    exerciseId: string,
    direction: "up" | "down",
  ) {
    const section = optimisticSections.find((s) => s.id === sectionId);
    if (!section) return;

    const index = section.exercises.findIndex((e) => e.id === exerciseId);
    if (index === -1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= section.exercises.length) return;

    const reorderedExercises = [...section.exercises];
    [reorderedExercises[index], reorderedExercises[targetIndex]] = [
      reorderedExercises[targetIndex],
      reorderedExercises[index],
    ];

    // 1️⃣ Optimistic UI update
    startTransition(() => {
      updateOptimisticSections({
        type: "replace-section",
        tempId: section.id,
        section: {
          ...section,
          exercises: reorderedExercises.map((e, i) => ({
            ...e,
            order: i,
          })),
        },
      });
    });

    // 2️⃣ Persist to server
    reorderExercisesInSection(
      programId,
      sectionId,
      reorderedExercises.map((e) => e.id),
    );
  }

  return (
    <div className="workout-block">
      {/* Header Bar */}
      <div className="workout-block-header">
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="collapse-btn"
          title={collapsed ? "Expand workout" : "Collapse workout"}
        >
          <ChevronDown
            size={18}
            className={`transition-transform ${collapsed ? "-rotate-90" : "rotate-0"}`}
          />
        </button>
        <div className="flex-1 min-w-[220px]">
          {editing ? (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={saveName}
              onKeyDown={(e) => e.key === "Enter" && saveName()}
              className="w-full px-3 py-1.5 text-lg font-semibold border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-base text-base"
              autoFocus
            />
          ) : (
            <h2
              className="workout-block-name flex items-center gap-2 cursor-pointer group"
              onClick={() => setEditing(true)}
            >
              {name}
              <Pencil
                size={13}
                className="text-muted group-hover:text-secondary-color transition-colors opacity-0 group-hover:opacity-100"
              />
            </h2>
          )}
        </div>

        <div className="workout-block-actions">
          <select
            value={day}
            onChange={(e) => saveDay(e.target.value as WorkoutDay)}
            className="section-tag"
          >
            <option value="MONDAY">Mon</option>
            <option value="TUESDAY">Tue</option>
            <option value="WEDNESDAY">Wed</option>
            <option value="THURSDAY">Thu</option>
            <option value="FRIDAY">Fri</option>
            <option value="SATURDAY">Sat</option>
            <option value="SUNDAY">Sun</option>
          </select>

          <div className="flex gap-3 text-sm">
            <button onClick={onDuplicate} className="wba-btn wba-duplicate">
              <Copy size={16} /> Duplicate
            </button>
            <button onClick={onDelete} className="wba-btn wba-delete">
              <Trash2 size={16} /> Delete
            </button>
          </div>
        </div>
      </div>

      {!collapsed && (
        <>
          {/* Sections + Exercises */}
          <div className="space-y-5">
            {optimisticSections.length === 0 ? (
              <div className="py-8 text-center text-gray-500 italic">
                No sections yet — add one to start building the workout.
              </div>
            ) : (
              optimisticSections.map((section) => (
                <div
                  key={section.id}
                  className="border border-dashed border-muted rounded-lg bg-white overflow-hidden transition-shadow hover:shadow-md m-2 p-2"
                >
                  {/* Section title – either editable input or clickable h3 */}
                  <div className="section-header">
                    {" "}
                    {editingSectionId === section.id ? (
                      <input
                        type="text"
                        value={sectionTitles[section.id] ?? section.title}
                        onChange={(e) =>
                          setSectionTitles((prev) => ({
                            ...prev,
                            [section.id]: e.target.value,
                          }))
                        }
                        onBlur={() =>
                          saveSectionTitle(
                            section.id,
                            sectionTitles[section.id] ?? section.title,
                          )
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            saveSectionTitle(
                              section.id,
                              sectionTitles[section.id] ?? section.title,
                            );
                          }
                          if (e.key === "Escape") {
                            setEditingSectionId(null);
                            // Optional: revert title if you want
                            // setSectionTitles((prev) => ({ ...prev, [section.id]: section.title }));
                          }
                        }}
                        className="section-tag"
                        autoFocus
                      />
                    ) : (
                      <h3
                        className="section-header-label"
                        onClick={() => startEditSection(section.id)}
                      >
                        {section.title}
                        <Pencil
                          size={14}
                          className="opacity-0 group-hover:opacity-60"
                        />
                      </h3>
                    )}
                    <div className="section-header-line"></div>
                    {/* section controls */}
                    <div className="reorder-btns-section flex flex-row">
                      <button
                        onClick={() => moveSectionUp(section.id)}
                        className="reorder-btn"
                        title="Move up"
                      >
                        <ChevronUp size={16} />
                      </button>
                      <button
                        onClick={() => moveSectionDown(section.id)}
                        className="reorder-btn"
                        title="Move down"
                      >
                        <ChevronDown size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteSection(section.id)}
                        className="del-btn"
                        title="Delete section"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Exercises */}
                  <div className="divide-y divide-gray-100">
                    {section.exercises.length === 0 ? (
                      <div className="px-4 py-5 text-sm text-gray-500 italic">
                        No exercises in this section yet
                      </div>
                    ) : (
                      section.exercises.map((we) => (
                        <div key={we.id} className="exercise-row">
                          {/* TOP ROW (mobile): reorder + section select */}
                          <div className="flex items-center justify-between gap-3 md:hidden">
                            <div className="flex items-center gap-2 text-gray-400">
                              <button
                                onClick={() =>
                                  moveExerciseWithinSection(
                                    section.id,
                                    we.id,
                                    "up",
                                  )
                                }
                                className="p-2 rounded-lg hover:text-gray-700 hover:bg-gray-200/60"
                                aria-label="Move up"
                              >
                                <ChevronUp size={18} />
                              </button>
                              <button
                                onClick={() =>
                                  moveExerciseWithinSection(
                                    section.id,
                                    we.id,
                                    "down",
                                  )
                                }
                                className="p-2 rounded-lg hover:text-gray-700 hover:bg-gray-200/60"
                                aria-label="Move down"
                              >
                                <ChevronDown size={18} />
                              </button>
                            </div>

                            <select
                              value={section.id}
                              onChange={async (e) => {
                                const target = e.target.value;
                                startTransition(() =>
                                  updateOptimisticSections({
                                    type: "move-exercise",
                                    exerciseId: we.id,
                                    fromSectionId: section.id,
                                    toSectionId: target,
                                  }),
                                );
                                await moveWorkoutExercise(
                                  programId,
                                  we.id,
                                  target,
                                );
                              }}
                              className="section-tag"
                            >
                              {optimisticSections.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.title}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* DESKTOP reorder buttons */}
                          <div className="hidden md:flex items-center gap-1 text-gray-400">
                            <button
                              onClick={() =>
                                moveExerciseWithinSection(
                                  section.id,
                                  we.id,
                                  "up",
                                )
                              }
                              className="p-1.5 hover:text-gray-700 rounded hover:bg-gray-200/60"
                            >
                              <ChevronUp size={16} />
                            </button>
                            <button
                              onClick={() =>
                                moveExerciseWithinSection(
                                  section.id,
                                  we.id,
                                  "down",
                                )
                              }
                              className="p-1.5 hover:text-gray-700 rounded hover:bg-gray-200/60"
                            >
                              <ChevronDown size={16} />
                            </button>
                          </div>

                          {/* DESKTOP section select */}
                          <select
                            value={section.id}
                            onChange={async (e) => {
                              const target = e.target.value;
                              startTransition(() =>
                                updateOptimisticSections({
                                  type: "move-exercise",
                                  exerciseId: we.id,
                                  fromSectionId: section.id,
                                  toSectionId: target,
                                }),
                              );
                              await moveWorkoutExercise(
                                programId,
                                we.id,
                                target,
                              );
                            }}
                            className="section-tag "
                          >
                            {optimisticSections.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.title}
                              </option>
                            ))}
                          </select>

                          {/* MAIN CONTENT */}
                          <div className="exercise-info">
                            <button
                              type="button"
                              onClick={() => setOpenExerciseId(we.exercise!.id)}
                              className="
                                  exercise-name
                                    "
                            >
                              <div className="flex flex-col md:flex-row gap-2 items-center">
                                {we.exercise?.name || "Missing exercise"}
                                {we.exercise?.videoUrl && <Video size={12} />}
                              </div>
                            </button>

                            <div className="exercise-sets">
                              {formatPrescribed(we.prescribed as Prescribed)}
                            </div>

                            {we.notes && (
                              <p className="text-xs text-gray-500 mt-1 italic">
                                {we.notes}
                              </p>
                            )}
                          </div>

                          {/* DELETE */}
                          <button
                            onClick={() => handleDeleteExercise(we.id)}
                            className="del-btn"
                            title="Remove exercise"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Add Exercise Form */}
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-syne font-bold text-sm text-foreground">
                  Add Exercise
                </h4>
                <p className="text-xs text-muted mt-0.5">
                  Choose a section and configure the exercise
                </p>
              </div>
              <button
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-secondary-color transition-colors px-3 py-1.5 rounded-xl bg-white border border-transparent hover:border-secondary-color/20"
                onClick={handleAddSection}
              >
                <Plus size={13} /> New section
              </button>
            </div>

            {/* Section selector */}
            <div>
              <label className={labelCls}>Section</label>
              <select
                value={sectionId}
                onChange={(e) => setSectionId(e.target.value)}
                className={inputCls}
              >
                {optimisticSections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.title}
                  </option>
                ))}
              </select>
            </div>

            <div ref={containerRef} className="flex flex-wrap gap-3 items-end pt-4">
              <div className="min-w-[220px] flex-1">
                <label className={labelCls}>Exercise</label>
                <button
                  type="button"
                  onClick={() => setShowSearch(true)}
                  className="w-full text-left px-3 py-2 bg-white border border-surface2 rounded-xl text-sm hover:border-secondary-color/30 transition-colors"
                >
                  {exercises.find((e) => e.id === exerciseId)?.name ??
                    "Select exercise"}
                </button>

                {showSearch && (
                  <div className="absolute z-50 mt-2 w-fit bg-white border border-surface2 rounded-2xl shadow-xl p-4">
                    <ExerciseSearch
                      onSelect={(exercise) => {
                        setExerciseId(exercise.id);
                        setShowSearch(false);
                      }}
                    />
                  </div>
                )}
              </div>
              {/* ADD FIELDS */}

              {showStrengthFields && (
                <>
                  <div className="w-20">
                    <label className={labelCls}>
                      Sets
                    </label>
                    <input
                      type="number"
                      value={sets}
                      onChange={(e) => setSets(Number(e.target.value))}
                      className={inputCls}
                    />
                  </div>
                  <div className="w-20">
                    <label className={labelCls}>
                      Reps
                    </label>
                    <input
                      type="number"
                      value={reps}
                      onChange={(e) => setReps(Number(e.target.value))}
                      className={inputCls}
                    />
                  </div>
                  {selectedExercise?.type !== "BODYWEIGHT" && (
                    <div className="w-24">
                      <label className={labelCls}>
                        Weight
                      </label>
                      <input
                        type="number"
                        value={weight ?? ""}
                        onChange={(e) =>
                          setWeight(
                            e.target.value ? Number(e.target.value) : null,
                          )
                        }
                        className={inputCls}
                      />
                    </div>
                  )}
                </>
              )}

              {showHybridFields && (
                <>
                  <div className="w-20">
                    <label className={labelCls}>
                      Sets
                    </label>
                    <input
                      type="number"
                      value={sets}
                      onChange={(e) => setSets(Number(e.target.value))}
                      className={inputCls}
                    />
                  </div>
                  <div className="w-20">
                    <label className={labelCls}>
                      Reps
                    </label>
                    <input
                      type="number"
                      value={reps}
                      onChange={(e) => setReps(Number(e.target.value))}
                      className={inputCls}
                    />
                  </div>
                  {selectedExercise?.type !== "BODYWEIGHT" && (
                    <div className="w-24">
                      <label className={labelCls}>
                        Weight
                      </label>
                      <input
                        type="number"
                        value={weight ?? ""}
                        onChange={(e) =>
                          setWeight(
                            e.target.value ? Number(e.target.value) : null,
                          )
                        }
                        className={inputCls}
                      />
                    </div>
                  )}
                  <div className="w-20">
                    <label className={labelCls}>
                      Duration
                    </label>
                    <input
                      type="number"
                      value={time ?? ""}
                      onChange={(e) =>
                        setTime(e.target.value ? Number(e.target.value) : null)
                      }
                      className={inputCls}
                    />
                  </div>
                </>
              )}

              {showCoreMobilityFields && (
                <>
                  <div className="w-20">
                    <label className={labelCls}>
                      Sets
                    </label>
                    <input
                      type="number"
                      value={sets}
                      onChange={(e) => setSets(Number(e.target.value))}
                      className={inputCls}
                    />
                  </div>
                  <div className="w-20">
                    <label className={labelCls}>
                      Reps
                    </label>
                    <input
                      type="number"
                      value={reps}
                      onChange={(e) => setReps(Number(e.target.value))}
                      className={inputCls}
                    />
                  </div>
                  {selectedExercise?.type !== "BODYWEIGHT" && (
                    <div className="w-24">
                      <label className={labelCls}>
                        Weight
                      </label>
                      <input
                        type="number"
                        value={weight ?? ""}
                        onChange={(e) =>
                          setWeight(
                            e.target.value ? Number(e.target.value) : null,
                          )
                        }
                        className={inputCls}
                      />
                    </div>
                  )}
                  <div className="w-28">
                    <label className={labelCls}>
                      Duration (s)
                    </label>
                    <input
                      type="number"
                      value={time ?? ""}
                      onChange={(e) =>
                        setTime(e.target.value ? Number(e.target.value) : null)
                      }
                      className={inputCls}
                    />
                  </div>
                </>
              )}

              {showTimedFields && (
                <div className="w-28">
                  <label className={labelCls}>
                    Duration (s)
                  </label>
                  <input
                    type="number"
                    value={time ?? ""}
                    onChange={(e) =>
                      setTime(e.target.value ? Number(e.target.value) : null)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-base"
                  />
                </div>
              )}

              <div className="flex-1 min-w-[260px]">
                <label className={labelCls}>
                  Notes / tempo / rest
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. 3-0-1-0 tempo, 90s rest"
                  className={`${inputCls} resize-none`}
                  rows={2}
                />
              </div>

              <button
                onClick={handleAddExercise}
                disabled={!exerciseId || !sectionId}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-secondary-color text-black font-syne font-bold text-sm rounded-xl hover:opacity-90 active:scale-[0.97] transition disabled:opacity-30 disabled:cursor-not-allowed self-end"
              >
                Add Exercise
              </button>
            </div>
          </div>
          {openExerciseId && (
            <ExerciseModal
              exerciseId={openExerciseId}
              onClose={() => setOpenExerciseId(null)}
            />
          )}
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </>
      )}
    </div>
  );
}
