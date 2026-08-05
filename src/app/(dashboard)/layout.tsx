import { AdminHeader } from "@/shared/components/admin-header";
import { SearchProvider } from "@/shared/components/search-context";
import { Sidebar } from "@/shared/components/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
