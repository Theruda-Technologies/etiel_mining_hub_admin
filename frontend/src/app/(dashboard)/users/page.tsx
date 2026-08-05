import { UsersTable, listUsers } from "@/features/users";

export default async function UsersPage() {
  const users = await listUsers();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
      <UsersTable users={users} />
    </div>
  );
}
