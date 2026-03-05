export function getPercentageForReps(reps: number): number {
  if (reps <= 1) return 1.0;
  if (reps === 2) return 0.95;
  if (reps === 3) return 0.92;
  if (reps === 4) return 0.89;
  if (reps === 5) return 0.86;
  if (reps === 6) return 0.83;
  if (reps === 7) return 0.8;
  if (reps === 8) return 0.78;
  if (reps === 9) return 0.75;
  if (reps === 10) return 0.72;
  if (reps <= 12) return 0.67;
  return 0.6; // 15+ reps
}
