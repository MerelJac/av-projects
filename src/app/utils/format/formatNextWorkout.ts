export function formatNextWorkout(date: Date) {
  const timeZone = "America/Los_Angeles";

  // Get "now" in Pacific time
  const now = new Date();
  const pstNow = new Date(
    now.toLocaleString("en-US", { timeZone })
  );

  pstNow.setHours(0, 0, 0, 0);

  // Normalize workout date into Pacific as well
  const pstWorkout = new Date(
    date.toLocaleString("en-US", { timeZone })
  );

  pstWorkout.setHours(0, 0, 0, 0);

  if (pstWorkout.getTime() === pstNow.getTime()) {
    return "Today";
  }

  return pstWorkout.toLocaleDateString(undefined, {
    weekday: "long",
  });
}