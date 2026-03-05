import { WorkoutDay } from "@/types/enums";

export function getNextDateForDay(start: Date, day: WorkoutDay) {
  const dayMap = {
    MONDAY: 1,
    TUESDAY: 2,
    WEDNESDAY: 3,
    THURSDAY: 4,
    FRIDAY: 5,
    SATURDAY: 6,
    SUNDAY: 0,
  };

  const target = dayMap[day];
  const date = new Date(start);

  while (date.getDay() !== target) {
    date.setDate(date.getDate() + 1);
  }

  return date;
}
