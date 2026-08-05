import { redirect } from "next/navigation";
import { getSession } from "@/features/auth/lib/server";
import { SettingsPanel } from "@/features/settings/components/settings-panel";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return <SettingsPanel session={session} />;
}
