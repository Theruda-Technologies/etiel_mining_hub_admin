import { redirect } from "next/navigation";
import { getSession } from "@/features/auth/lib/server";
import { LoginForm } from "@/features/auth/components/login-form";
import { LoginFooter } from "./login-footer";

export default async function LoginPage() {
  const session = await getSession();
  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="relative flex min-h-full flex-1 flex-col">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=2000&q=80')",
        }}
      />
      <div className="absolute inset-0 bg-black/75" />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-10">
        <LoginForm />
      </div>

      <LoginFooter />
    </main>
  );
}
