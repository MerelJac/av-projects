// src/app/trainer/layout.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import SidebarLayout from "../components/team/Sidebar";

export default async function TeamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
    const session = await getServerSession(authOptions);
  
      if (!session) {
        redirect("/login");
      }

  return <SidebarLayout role={session.user.role}>{children}</SidebarLayout>;
}
