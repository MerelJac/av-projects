"use client";
import {
  addSubstitution,
  removeSubstitution,
} from "@/app/(team)/exercises/[exerciseId]/edit/actions";
import { Exercise, ExerciseSubstitution } from "@prisma/client";
import { useState } from "react";
import { ExerciseSearch } from "../workout/ExerciseSearch";
import { ArrowLeftRight, Plus, X } from "lucide-react";

const inputCls = "w-full px-4 py-2.5 bg-white border border-surface2 rounded-xl text-foreground text-sm placeholder:text-muted focus:border-secondary-color/50 focus:ring-1 focus:ring-secondary-color/30 outline-none transition";
const labelCls = "block text-[10px] font-semibold tracking-widest uppercase text-muted mb-1.5";

export default function SubstitutionsEditor({
  exercise,
}: {
  exercise: Exercise & {
    substitutionsFrom: (ExerciseSubstitution & {
      substituteExercise: Exercise;
    })[];
  };
}) {
  const EMPTY_EXERCISE: Exercise = {
    id: "", name: "", type: "STRENGTH",
    equipment: null, muscleGroup: null, videoUrl: null, notes: null, trainerId: null,
  };

  const [showSearch, setShowSearch] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise>(EMPTY_EXERCISE);

  return (
    <div className="bg-white border border-surface2 rounded-2xl">

      {/* Header */}
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-surface2">
        <div className="w-8 h-8 rounded-xl bg-secondary-color/10 flex items-center justify-center">
          <ArrowLeftRight size={14} className="text-secondary-color" />
        </div>
        <h2 className="font-syne font-bold text-base text-foreground">Substitutions</h2>
      </div>

      <div className="p-5 space-y-5">

        {/* Existing substitutions */}
        {exercise.substitutionsFrom.length === 0 ? (
          <p className="text-sm text-muted italic text-center py-4">No substitutions added yet.</p>
        ) : (
          <ul className="space-y-2">
            {exercise.substitutionsFrom.map((sub) => (
              <li
                key={sub.id}
                className="flex items-start justify-between gap-4 bg-white border border-surface2 rounded-xl px-4 py-3"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-secondary-color mt-2 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {sub.substituteExercise.name}
                    </p>
                    {sub.note && (
                      <p className="text-xs text-muted mt-0.5">{sub.note}</p>
                    )}
                  </div>
                </div>
                <form action={removeSubstitution}>
                  <input type="hidden" name="id" value={sub.id} />
                  <input type="hidden" name="exerciseId" value={exercise.id} />
                  <button
                    type="submit"
                    className="w-7 h-7 rounded-lg bg-danger/10 flex items-center justify-center text-danger hover:bg-danger/20 transition flex-shrink-0"
                  >
                    <X size={12} />
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}

        {/* Divider */}
        <div className="border-t border-surface2" />

        {/* Add new substitution */}
        <div className="space-y-4">
          <p className="text-[10px] font-semibold tracking-widest uppercase text-muted">
            Add Substitution
          </p>

          <form action={addSubstitution} className="space-y-4">
            <input type="hidden" name="exerciseId" value={exercise.id} />

            <div className="relative">
              <label className={labelCls}>Substitute Exercise</label>
              <input type="hidden" name="substituteId" value={selectedExercise?.id ?? ""} required />

              {!selectedExercise.id ? (
                <button
                  type="button"
                  onClick={() => setShowSearch(true)}
                  className="w-full flex justify-between items-center px-4 py-2.5 bg-white border border-surface2 rounded-xl hover:border-secondary-color/30 transition text-left"
                >
                  <span className="text-sm text-muted">Search for an exercise…</span>
                  <span className="text-xs font-semibold text-secondary-color">Browse →</span>
                </button>
              ) : (
                <div className="flex justify-between items-center px-4 py-3 bg-secondary-color/5 border border-secondary-color/20 rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-foreground">{selectedExercise.name}</p>
                    <p className="text-xs text-muted mt-0.5">
                      {selectedExercise.type}{selectedExercise.muscleGroup && ` · ${selectedExercise.muscleGroup}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedExercise(EMPTY_EXERCISE)}
                    className="text-xs font-semibold text-danger hover:opacity-80 transition"
                  >
                    Change
                  </button>
                </div>
              )}

              {showSearch && (
                <div className="absolute z-50 mt-2 w-full bg-white border border-surface2 rounded-2xl shadow-xl p-4">
                  <ExerciseSearch
                    onSelect={(ex) => {
                      if (ex.id === exercise.id) return;
                      setSelectedExercise({
                        id: ex.id, name: ex.name, type: ex.type,
                        equipment: ex.equipment ?? null, muscleGroup: ex.muscleGroup ?? null,
                        videoUrl: ex.videoUrl ?? null, notes: ex.notes ?? null, trainerId: ex.trainerId ?? null,
                      });
                      setShowSearch(false);
                    }}
                  />
                </div>
              )}
            </div>

            {/* <div>
              <label className={labelCls}>Note <span className="normal-case tracking-normal font-normal">(optional)</span></label>
              <textarea
                id="note" name="note"
                placeholder="e.g. Use dumbbells if no barbell available"
                className={`${inputCls} resize-y`}
                rows={3}
              />
            </div> */}

            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-secondary-color text-black font-syne font-bold text-sm rounded-xl hover:opacity-90 active:scale-[0.98] transition"
            >
              <Plus size={14} />
              Add Substitution
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}