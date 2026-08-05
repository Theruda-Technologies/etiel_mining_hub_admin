import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1">
      <aside className="flex w-56 flex-col gap-2 border-r border-zinc-200 p-4">
        <p className="mb-4 text-sm font-semibold tracking-tight">
          Etiel Mining Hub
        </p>
        <Link href="/dashboard" className="text-sm hover:underline">
          Dashboard
        </Link>
        <Link href="/users" className="text-sm hover:underline">
          Users
        </Link>
        <Link href="/login" className="mt-auto text-sm text-zinc-500 hover:underline">
          Sign out
        </Link>
      </aside>
      <div className="flex-1 p-6">{children}</div>
    </div>
  );
}
