import { Profile } from "./profile";
import { BodyMetric } from "./bodyMetric";
import { ScheduledWorkout, ScheduledWorkoutWithProgram } from "./workout";
import { Prisma } from "@prisma/client";

export type Client = {
  id: string;
  email: string;
  phone?: string;
  profile: Profile | null;
  bodyMetrics: BodyMetric[];

  trainerId?: string | null;
  createdAt: Date;
  scheduledWorkouts: ScheduledWorkoutWithProgram[];
};

export type ClientListItem = {
  id: string;
  email: string;
  profile: {
    firstName: string;
    lastName: string;
    waiverSignedAt: Date | null;
  } | null;
};

export type ClientWithWorkouts = {
  id: string;
  email: string;
  profile?: {
    firstName?: string | null;
    lastName?: string | null;
  } | null;
  scheduledWorkouts: ScheduledWorkout[];
};

export type ClientProfilePageUser = Prisma.UserGetPayload<{
  include: {
    profile: true;
    bodyMetrics: true;
    scheduledWorkouts: {
      include: {
        workout: true;
      };
    };
    workoutLogs: {
      include: {
        scheduled: {
          include: {
            workout: true;
          };
        };
      };
    };
    additionalWorkouts: {
      include: {
        type: true;
      };
    };
  };
}>;

export type TrainerClientProfile = Prisma.UserGetPayload<{
  include: {
    profile: true;

    bodyMetrics: {
      orderBy: { recordedAt: "asc" };
    };

    scheduledWorkouts: {
      include: {
        workout: {
          include: {
            program: true;
          };
        };
      };
    };

    additionalWorkouts: {
      include: {
        type: true;
      };
    };
  };
}>;
