import { Prisma, WorkoutDay, WorkoutStatus } from "@prisma/client";
import type { ExerciseType, Exercise } from "./exercise";
import { Performed, Prescribed } from "./prescribed";
import { JsonValue } from "@prisma/client/runtime/client";

export type Workout = {
  id: string;
  programId: string;
  name: string;
  order: number;
  createdAt?: string;
};

export type Prescription = {
  sets?: number;
  reps?: number;
  weight?: number;
  durationSeconds?: number;
  distanceMeters?: number;
};

export type WorkoutExercise = {
  id: string;
  workoutId: string;
  exerciseId: string;
  order: number;

  type: ExerciseType;
  prescription: Prescription;
};

export type WorkoutExerciseWithExercise = WorkoutExercise & {
  exercise: Exercise;
};

export type WorkoutWithSections = {
  id: string;
  name: string;
  order: number;
  day: WorkoutDay;
  workoutSections: {
    id: string;
    title: string;
    order: number;
    exercises: {
      id: string;
      order: number;
      prescribed: Prescribed | JsonValue | null;
      notes: string | null;
      exercise: {
        id: string;
        name: string;
        type: ExerciseType;
      } | null;
    }[];
  }[];
};

export type WorkoutTemplate = {
  id: string;
  programId: string;
  name: string;
  order: number;
  day: WorkoutDay;
};

export type WorkoutSection = {
  id: string;
  workoutId: string;
  title: string;
  order: number;
};

export type WorkoutWithExercises = {
  id: string;
  name: string;
  order: number;
  exercises: {
    notes?: string | null;
    id: string;
    order: number;
    prescribed: Prescribed | JsonValue | null;
    exercise: Exercise;
  }[];
  day: WorkoutDay;
};

export type ScheduledWorkout = {
  status: WorkoutStatus;
  workout: {
    program: {
      id: string;
      name: string;
    } | null;
  };
};

export type ScheduledWorkoutWithProgram = {
  id: string;
  scheduledDate: Date;
  status: WorkoutStatus;
  workout: {
    id: string;
    name: string;
    program: {
      id: string;
      name: string;
    } | null;
  };
};

export type ExerciseLog = {
  id: string;
  workoutLogId: string;
  exerciseId: string;
  exerciseName: string;
  prescribed: Prescribed | JsonValue | null;
  performed: Performed | null;

  substitutedFrom?: string | null;
  substitutionReason?: string | null;
};

export type ScheduledWorkoutWithLogs = Prisma.ScheduledWorkoutGetPayload<{
  include: {
    workout: {
      include: {
        program: true;
        workoutSections: {
          include: {
            exercises: {
              include: {
                exercise: true;
              };
            };
          };
        };
      };
    };
    workoutLogs: {
      include: {
        exercises: {
          include: {
            exercise: true;
          };
        };
      };
    };
  };
}>;

export type WorkoutSectionWithExercises = {
  id: string;
  title: string;
  order: number;
  exercises: SectionExercise[];
};

export type ProgramWithWorkouts = {
  id: string;
  name: string;
  notes?: string | null;
  trainerId: string;
  workouts: WorkoutWithSections[];
};

export type ScheduledWorkoutDashboard = {
  id: string;
  scheduledDate: Date;
  status: WorkoutStatus;
  workout: {
    id: string;
    name: string;
    workoutSections: {
      id: string;
      title: string;
      order: number;
      exercises: {
        id: string;
        order: number;
        exercise: {
          id: string;
          name: string;
        } | null;
      }[];
    }[];
  };
};

export type SectionExercise = {
  id: string;
  order: number;
  exercise: Exercise | null;
  exerciseId: string;
  prescribed: Prescribed | null;
  notes: string | null;
};

export type ScheduledWorkoutWithWorkout = Prisma.ScheduledWorkoutGetPayload<{
  include: {
    workout: {
      select: {
        id: true;
        name: true;
      };
    };
  };
}>;
