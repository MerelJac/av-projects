import { parseExerciseType } from "@/lib/exerciseValidation";

export function buildExerciseData(formData: FormData) {
  const type = parseExerciseType(formData.get("type"));

  return {
    name: String(formData.get("name")),
    type,
    equipment: formData.get("equipment")
      ? String(formData.get("equipment"))
      : null,
    muscleGroup: formData.get("muscleGroup")
      ? String(formData.get("muscleGroup"))
      : null,
    videoUrl: formData.get("videoUrl")
      ? String(formData.get("videoUrl"))
      : null,
    notes: formData.get("notes")
      ? String(formData.get("notes"))
      : null,
    trainerId: formData.get("trainerId")
      ? String(formData.get("trainerId"))
      : undefined
  };
}
