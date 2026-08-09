import { redirect } from "next/navigation";
import { getSession } from "@/features/auth/lib/server";
import { AdminHeader } from "@/shared/components/admin-header";
import { MobileNavProvider } from "@/shared/components/mobile-nav-context";
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
      <MobileNavProvider>
        <div className="flex min-h-full min-w-0 flex-1 bg-background">
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <AdminHeader />
            <main className="flex-1 px-4 pt-4 pb-8 sm:px-6 sm:pt-5 lg:px-8">
              {children}
            </main>
          </div>
        </div>
      </MobileNavProvider>
    </SearchProvider>
  );
}
