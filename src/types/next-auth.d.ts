import { DefaultSession } from "next-auth";
import { Role } from "@prisma/client";
import { Permission } from "./user";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
   permissions: Permission[];
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
    permissions: Permission[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    permissions: Permission[];
  }
}
