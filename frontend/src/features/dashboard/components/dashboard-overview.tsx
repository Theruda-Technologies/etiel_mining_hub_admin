import type { DashboardStats } from "../types";

type DashboardOverviewProps = {
  stats: DashboardStats;
};

export function DashboardOverview({ stats }: DashboardOverviewProps) {
  return (
    <section className="grid gap-4 sm:grid-cols-2">
      <div className="rounded border border-zinc-200 p-4">
        <p className="text-sm text-zinc-500">Total users</p>
        <p className="mt-1 text-2xl font-semibold">{stats.totalUsers}</p>
      </div>
      <div className="rounded border border-zinc-200 p-4">
        <p className="text-sm text-zinc-500">Active sessions</p>
        <p className="mt-1 text-2xl font-semibold">{stats.activeSessions}</p>
      </div>
    </section>
  );
}
