import { Exercise } from "@/types/exercise";
import { Prescribed } from "@/types/prescribed";

export function formatPrescribed(p: Prescribed): string {
  switch (p.kind) {
    case "strength":
      return `${p.sets}×${p.reps}${p.weight ? ` @ ${p.weight}` : ""}`;
      
    case "hybrid": {
      const base = `${p.sets}×${p.reps}`;
      const durationPart =
        typeof p.duration === "number" && p.duration > 0
          ? ` for ${p.duration}s`
          : "";
      const weightPart =
        typeof p.weight === "number" && p.weight > 0 ? ` @ ${p.weight}` : "";

      return `${base}${durationPart}${weightPart}`;
    }
    case "bodyweight":
      return `${p.sets}×${p.reps}`;

    case "core":
    case "mobility": {
      const repsPart =
        typeof p.reps === "number" && p.reps > 0
          ? `${p.sets}×${p.reps}`
          : `${p.sets}×`;

      const durationPart =
        typeof p.duration === "number" && p.duration > 0
          ? `${p.duration}s`
          : "";

      const weightPart =
        typeof p.weight === "number" && p.weight > 0 ? ` @ ${p.weight}` : "";

      return `${repsPart}${durationPart}${weightPart}`;
    }

    case "timed":
      return `${p.duration}s`;

    default:
      return "—";
  }
}

export function buildPrescribed(
  exercise: Exercise,
  sets: number,
  reps: number,
  weight: number | null,
  duration: number | null,
): Prescribed {
  switch (exercise.type) {
    case "STRENGTH":
      return {
        kind: "strength",
        sets,
        reps,
        weight,
      };

    case "HYBRID":
      return {
        kind: "hybrid",
        sets,
        reps,
        weight,
        duration,
      };

    case "BODYWEIGHT":
      return {
        kind: "bodyweight",
        sets,
        reps,
      };

    case "TIMED":
      return {
        kind: "timed",
        duration: reps * 10, // or whatever your UI decides
      };

    default:
      throw new Error(`Unsupported exercise type: ${exercise.type}`);
  }
}
