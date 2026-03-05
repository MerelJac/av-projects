import { Prisma } from "@prisma/client"

export type ExerciseType =
  | "STRENGTH"
  | "TIMED"
  | "HYBRID"
  | "BODYWEIGHT"
  | "MOBILITY"
  | "CORE"

export type Exercise = {
  id: string
  name: string
  type: ExerciseType

  equipment?: string | null
  muscleGroup?: string | null
  videoUrl?: string | null
  notes?: string | null

  // Ownership
  trainerId?: string | null // null = global/default exercise

  createdAt?: string
}

export type OneRMPoint = {
  date: string;
  value: number;
};

export type ExerciseDetail = {
  id: string;
  name: string;
  type: string;
  equipment: string | null;
  notes: string | null;
  muscleGroup: string | null;
  videoUrl: string | null;
  substitutions: {
    id: string;
    name: string;
    note: string | null;
  }[];
};

export type ExerciseLogWithSets =
  Prisma.ExerciseLogGetPayload<{
    include: {
      exercise: true;
      sets: true;
    };
  }>;

