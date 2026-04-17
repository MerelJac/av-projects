import { Role, Permission } from "@prisma/client";
import { Profile } from "./profile";

export { Permission };

export type User = {
  id: string;
  email: string;
  role: Role;
  profile?: Profile | null;
  permissions: Permission[];
};

export type UserWithProfile = User & { profile: Profile | null };
