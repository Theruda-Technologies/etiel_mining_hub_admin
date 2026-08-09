import { redirect } from "next/navigation";
import { getSession } from "@/features/auth/lib/server";

export default async function HomePage() {
  const session = await getSession();
  redirect(session ? "/dashboard" : "/login");
}
