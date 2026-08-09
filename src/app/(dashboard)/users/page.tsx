import { listUsers } from "@/features/users";
import { UsersPageClient } from "@/features/users/components/users-page-client";

export default async function UsersPage() {
  const users = await listUsers();
  return <UsersPageClient users={users} />;
}
