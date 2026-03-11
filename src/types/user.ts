import { Role } from "@prisma/client";
import { Profile } from "./profile";

export type User = {
  id: string;
  email: string;
  role: Role;
  trainerId?: string | null;
  profile?: Profile | null;
};


export type UserWithProfile = User & { profile: Profile | null };
