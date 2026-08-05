import { DashboardOverview, getDashboardStats } from "@/features/dashboard";

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <DashboardOverview stats={stats} />
    </div>
  );
}
