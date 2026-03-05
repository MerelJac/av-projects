// src/app/client/client/page.tsx
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ClientDashboard from "../../components/dashboard/ClientDashboard";

export default async function ClientPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if (session.user?.role === "TEAM") {
    redirect("/dashboard");
  }

  if (session.user?.role === "ADMIN") {
    redirect("/dashboard");
  }

  return <ClientDashboard />;
}