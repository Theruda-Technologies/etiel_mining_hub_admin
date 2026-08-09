import { redirect } from "next/navigation";
import { getSession } from "@/features/auth/lib/server";
import { AdminHeader } from "@/shared/components/admin-header";
import { SearchProvider } from "@/shared/components/search-context";
import { Sidebar } from "@/shared/components/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <SearchProvider>
      <div className="flex min-h-full flex-1 bg-background">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <AdminHeader />
          <main className="flex-1 px-8 pt-5 pb-8">{children}</main>
        </div>
      </div>
    </SearchProvider>
  );
}
