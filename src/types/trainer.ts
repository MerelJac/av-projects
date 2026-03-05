import { Prisma } from "@prisma/client";

export type TrainerWithClientsAndWorkouts = Prisma.UserGetPayload<{
  include: {
    clients: {
      include: {
        scheduledWorkouts: {
          select: {
            status: true;
          };
        };
      };
    };
  };
}>;