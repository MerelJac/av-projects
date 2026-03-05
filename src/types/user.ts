import { Role } from "./enums";
import { Profile } from "./profile";

export type User = {
  id: string;
  email: string;
  role: Role;
  trainerId?: string | null;
  profile?: Profile
};
