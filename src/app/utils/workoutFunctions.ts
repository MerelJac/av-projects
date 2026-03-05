import { Performed, Prescribed } from "@/types/prescribed";
export function buildPerformedFromPrescribed(
  prescribed: Prescribed,
): Performed {
  function assertNever(x: never): never {
    throw new Error(`Unhandled prescribed kind: ${JSON.stringify(x)}`);
  }
  switch (prescribed.kind) {
    case "strength":
      return {
        kind: prescribed.kind,
        sets: Array.from({ length: prescribed.sets }, () => ({
          reps: prescribed.reps,
          weight: prescribed.weight,
        })),
      };
    case "hybrid":
      return {
        kind: prescribed.kind,
        sets: Array.from({ length: prescribed.sets }, () => ({
          reps: prescribed.reps,
          weight: prescribed.weight,
          duration: prescribed.duration,
        })),
      };

    case "bodyweight":
      return {
        kind: "bodyweight",
        sets: Array.from({ length: prescribed.sets }, () => ({
          reps: prescribed.reps,
        })),
      };

    case "timed":
      return {
        kind: "timed",
        duration: prescribed.duration,
      };
    case "core":
      return {
        kind: "core",
        sets: Array.from({ length: prescribed.sets ?? 0 }, () => ({
          reps: prescribed.reps ?? 0,
          weight: prescribed.weight ?? null,
          duration: prescribed.duration ?? 0,
        })),
      };

    case "mobility":
      return {
        kind: "mobility",
        sets: Array.from({ length: prescribed.sets ?? 0 }, () => ({
          reps: prescribed.reps ?? 0,
          weight: prescribed.weight ?? null,
          duration: prescribed.duration ?? 0,
        })),
      };

    default:
      return assertNever(prescribed);
  }
}

export function renderPrescribed(prescribed: Prescribed) {
  switch (prescribed.kind) {
    case "strength":
      return `${prescribed.sets} × ${prescribed.reps}${
        prescribed.weight ? ` @ ${prescribed.weight} lb` : ""
      }`;
    case "hybrid":
      return `${prescribed.sets} × ${prescribed.reps}${
        prescribed.weight ? ` @ ${prescribed.weight} lb` : ""
      }${prescribed.duration ? ` for ${prescribed.duration} s` : ""}`;

    case "bodyweight":
      return `${prescribed.sets} × ${prescribed.reps}`;

    case "timed":
      return `${prescribed.duration} seconds`;
    case "core":
    case "mobility": {
      const parts: string[] = [];

      if (prescribed.sets && prescribed.reps) {
        parts.push(`${prescribed.sets} × ${prescribed.reps}`);
      }

      if (prescribed.duration) {
        parts.push(`${prescribed.duration}s`);
      }

      if (prescribed.weight) {
        parts.push(`${prescribed.weight}lbs`);
      }

      return parts.join(" · ");
    }

    default:
      return "";
  }
}
