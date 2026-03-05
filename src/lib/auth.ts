// src/lib/auth.ts
import NextAuth, { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },

  providers: [
    CredentialsProvider({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // ✅ normalize email
        const normalizedEmail = credentials?.email.trim().toLowerCase();
        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        });

        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password,
        );

        if (!isValid) return null;

        return user;
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.trainerId = user.trainerId;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.trainerId = token.trainerId as string | null;
      }
      return session;
    },
  },
};

export default NextAuth(authOptions);
