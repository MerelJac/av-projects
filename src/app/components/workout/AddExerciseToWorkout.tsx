import { useState } from "react";
import { AddExerciseToWorkoutModal } from "./AddExerciseToWorkoutModal";
export function AddExerciseToWorkout({
  workoutLogId,
  sectionId,
}: {
  workoutLogId: string;
  sectionId?: string | undefined;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="mt-4 w-full rounded-lg border border-dashed border-gray-300 py-3 text-sm text-muted hover:bg-gray-50"
      >
        + Add Exercise
      </button>

      <AddExerciseToWorkoutModal
        open={open}
        workoutLogId={workoutLogId}
        sectionId={sectionId || undefined}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
