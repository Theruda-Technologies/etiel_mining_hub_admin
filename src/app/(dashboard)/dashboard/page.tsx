import {
  DashboardOverview,
  getDashboardStats,
  getRecentOrders,
} from "@/features/dashboard";

export default async function DashboardPage() {
  const [stats, orders] = await Promise.all([
    getDashboardStats(),
    getRecentOrders(),
  ]);

  return <DashboardOverview stats={stats} orders={orders} />;
}
