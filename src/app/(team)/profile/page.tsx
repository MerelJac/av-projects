// src/app/(client)/profile/page.tsx
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notFound } from "next/navigation";

import { LogoutButton } from "@/app/components/Logout";

import { UserWithProfile } from "@/types/user";

export default async function ClientProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return notFound();

  const user: UserWithProfile | null = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      profile: true,
    },
  });

  if (!user) return notFound();

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="greeting">
        <h1>Your Profile</h1>
        <p className="text-sm text-gray-500">
          Manage your account details.
        </p>
      </div>

      {/* Profile */}


      {/* Logout */}
      <div className="pt-2 flex justify-center">
        <LogoutButton />
      </div>
    </div>
  );
}
