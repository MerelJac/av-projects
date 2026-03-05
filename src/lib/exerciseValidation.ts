import { ExerciseType } from "@/types/exercise";

export function parseExerciseType(
  value: FormDataEntryValue | null,
): ExerciseType {
  if (
    value === "STRENGTH" ||
    value === "TIMED" ||
    value === "HYBRID" ||
    value === "BODYWEIGHT" ||
    value === "CORE" ||
    value === "MOBILITY"
  ) {
    return value;
  }

  throw new Error("Invalid exercise type");
}
