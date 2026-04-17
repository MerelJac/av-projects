import { Role } from "@prisma/client"
import { Permission } from "./user"

declare module "@auth/core/types" {
  interface User {
    role: Role
    permissions: Permission[]
  }

  interface Session {
    user: {
      id: string
      role: Role
          permissions: Permission[]
    }
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string
    role: Role
        permissions: Permission[]
  }

}
