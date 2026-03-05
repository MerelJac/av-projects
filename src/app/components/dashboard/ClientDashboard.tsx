// src/components/dashboards/ClientDashboard.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";


export default async function ClientDashboard() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  return (
    <div className="greeting">
      <h1>Hello,</h1>
      <p>You are staying consistent — great work.</p>
    </div>
  );
}
