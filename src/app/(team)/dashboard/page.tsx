
import { getDashboardData } from "./actions";
import TeamDashboardClient from "./TeamDashboardClient";

export default async function TeamDashboard() {
  const data = await getDashboardData();
  return <TeamDashboardClient data={data} />;
}