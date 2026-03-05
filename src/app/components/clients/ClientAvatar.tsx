import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function ClientAvatar() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    select: {
      firstName: true,
      lastName: true,
    },
  });

  const fullName =
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") || "—";

  const initial = profile?.firstName?.[0]?.toUpperCase() ?? "?";

  return (
    <div
      className="client-avatar flex items-center justify-center rounded-full bg-gray-200 text-gray-900 font-semibold w-8 h-8"
      title={fullName}
    >
      {initial}
    </div>
  );
}