import { Exercise } from "@/types/exercise";
import { Prescribed } from "@/types/prescribed";

function getStrengthDefaults(value: Prescribed | null) {
  if (value?.kind === "strength") {
    return {
      sets: value.sets,
      reps: value.reps,
    };
  }

  return {
    sets: 3,
    reps: 8,
  };
}

function getCoreMobilityDefaults(value: Prescribed | null) {
  if (value?.kind === "core" || value?.kind === "mobility") {
    return {
      sets: value.sets ?? 2,
      reps: value.reps ?? 10,
      duration: value.duration ?? 30,
    };
  }

  return {
    sets: 2,
    reps: 10,
    duration: 30,
  };
}

export function PrescribedEditor({
  exercise,
  value,
  onChange,
}: {
  exercise: Exercise;
  value: Prescribed | null;
  onChange: (p: Prescribed) => void;
}) {
  /* ---------------- TIMED ---------------- */
  if (exercise.type === "TIMED") {
    return (
      <div className="space-y-1">
        <label className="text-xs text-gray-600">Duration (seconds)</label>
        <input
          type="number"
          defaultValue={value?.kind === "timed" ? value.duration : 30}
          className="w-full border rounded px-3 py-2 text-sm"
          onChange={(e) =>
            onChange({
              kind: "timed",
              duration: Number(e.target.value),
            })
          }
        />
      </div>
    );
  }
  /* ---------------- BODYWEIGHT ---------------- */
  if (exercise.type === "BODYWEIGHT") {
    const sets = value?.kind === "bodyweight" ? value.sets : 3;
    const reps = value?.kind === "bodyweight" ? value.reps : 10;

    return (
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-gray-600">Sets</label>
          <input
            type="number"
            defaultValue={sets}
            className="w-full border rounded px-2 py-1 text-sm"
            onChange={(e) =>
              onChange({
                kind: "bodyweight",
                sets: Number(e.target.value),
                reps,
              })
            }
          />
        </div>

        <div>
          <label className="text-xs text-gray-600">Reps</label>
          <input
            type="number"
            defaultValue={reps}
            className="w-full border rounded px-2 py-1 text-sm"
            onChange={(e) =>
              onChange({
                kind: "bodyweight",
                sets,
                reps: Number(e.target.value),
              })
            }
          />
        </div>
      </div>
    );
  }
  /* -------- HYBRID -------- */

  if (exercise.type === "HYBRID") {
    const sets = value?.kind === "hybrid" ? value.sets : 3;
    const reps = value?.kind === "hybrid" ? value.reps : 8;
    const weight = value?.kind === "hybrid" ? value.weight : null;
    const duration = value?.kind === "hybrid" ? value.duration : null;

    return (
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-xs text-gray-600">Sets</label>
          <input
            type="number"
            defaultValue={sets}
            className="w-full border rounded px-2 py-1 text-sm"
            onChange={(e) =>
              onChange({
                kind: "hybrid",
                sets: Number(e.target.value),
                reps,
                weight,
                duration,
              })
            }
          />
        </div>

        <div>
          <label className="text-xs text-gray-600">Reps</label>
          <input
            type="number"
            defaultValue={reps}
            className="w-full border rounded px-2 py-1 text-sm"
            onChange={(e) =>
              onChange({
                kind: "hybrid",
                sets,
                reps: Number(e.target.value),
                weight,
                duration,
              })
            }
          />
        </div>

        <div>
          <label className="text-xs text-gray-600">Weight</label>
          <input
            type="number"
            defaultValue={weight ?? ""}
            className="w-full border rounded px-2 py-1 text-sm"
            onChange={(e) =>
              onChange({
                kind: "hybrid",
                sets,
                reps,
                weight: e.target.value === "" ? null : Number(e.target.value),
                duration,
              })
            }
          />
        </div>

        <div>
          <label className="text-xs text-gray-600">Duration</label>
          <input
            type="number"
            defaultValue={duration ?? ""}
            className="w-full border rounded px-2 py-1 text-sm"
            onChange={(e) =>
              onChange({
                kind: "hybrid",
                sets,
                reps,
                weight,
                duration: e.target.value === "" ? null : Number(e.target.value),
              })
            }
          />
        </div>
      </div>
    );
  }

  /* -------- CORE & MOBILITY -------- */
  if (exercise.type === "CORE" || exercise.type === "MOBILITY") {
    const { sets, reps, duration } = getCoreMobilityDefaults(value);
    const kind = exercise.type === "CORE" ? "core" : "mobility";

    return (
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-xs text-gray-600">Sets</label>
          <input
            type="number"
            defaultValue={sets}
            className="w-full border rounded px-2 py-1 text-sm"
            onChange={(e) =>
              onChange({
                kind,
                sets: Number(e.target.value),
                reps,
                duration,
                weight: null,
              })
            }
          />
        </div>

        <div>
          <label className="text-xs text-gray-600">Reps</label>
          <input
            type="number"
            defaultValue={reps}
            className="w-full border rounded px-2 py-1 text-sm"
            onChange={(e) =>
              onChange({
                kind,
                sets,
                reps: Number(e.target.value),
                duration,
                weight: null,
              })
            }
          />
        </div>

        <div>
          <label className="text-xs text-gray-600">Seconds</label>
          <input
            type="number"
            defaultValue={duration}
            className="w-full border rounded px-2 py-1 text-sm"
            onChange={(e) =>
              onChange({
                kind,
                sets,
                reps,
                duration: Number(e.target.value),
                weight: null,
              })
            }
          />
        </div>
      </div>
    );
  }

  /* ---------------- STRENGTH ---------------- */
  if (exercise.type === "STRENGTH") {
    const { sets, reps } = getStrengthDefaults(value);

    return (
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-gray-600">Sets</label>
          <input
            type="number"
            defaultValue={sets}
            className="w-full border rounded px-2 py-1 text-sm"
            onChange={(e) =>
              onChange({
                kind: "strength",
                sets: Number(e.target.value),
                reps,
                weight: null,
              })
            }
          />
        </div>

        <div>
          <label className="text-xs text-gray-600">Reps</label>
          <input
            type="number"
            defaultValue={reps}
            className="w-full border rounded px-2 py-1 text-sm"
            onChange={(e) =>
              onChange({
                kind: "strength",
                sets,
                reps: Number(e.target.value),
                weight: null,
              })
            }
          />
        </div>
      </div>
    );
  }

  return null;
}
