import { Role } from "@prisma/client"

declare module "@auth/core/types" {
  interface User {
    role: Role
  }

  interface Session {
    user: {
      id: string
      role: Role
    }
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string
    role: Role
  }
}
