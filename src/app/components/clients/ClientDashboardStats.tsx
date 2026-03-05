import { formatNextWorkout } from "@/app/utils/format/formatNextWorkout";

export function ClientDashboardStats({
  streak,
  completed,
  scheduled,
  nextWorkoutDate,
}: {
  streak: number;
  completed: number;
  scheduled: number;
  nextWorkoutDate: Date | null;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* On-Plan Streak */}
      {streak > 0 && (
        <div className="stat-card streak-card">
          <div className="">
            <span className="label-light">On-Plan Streak</span>
          </div>

          <div className="big-num">
            {streak}
            <span className="small-text"> days</span>
          </div>
        </div>
      )}

      {/* Weekly Progress */}
      <div className="stat-card accent-card">
        <div className="">
          <span className="label">This Week</span>
        </div>

        <div className="big-num">
          {completed}
          <span className="small-num"> /{scheduled}</span>
        </div>

        <p className="text-sm text-gray-500 mt-1">workouts completed</p>
      </div>

      {/* Next Workout */}

      <div className="stat-card">
        <div className="label">Next Workout</div>
        <div className="big-text">
          {" "}
          {nextWorkoutDate
            ? formatNextWorkout(nextWorkoutDate)
            : "None scheduled"}
        </div>
      </div>
    </div>
  );
}
