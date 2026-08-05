import { LoginForm } from "@/features/auth";

export default function LoginPage() {
  return (
    <main className="flex min-h-full flex-1 flex-col items-center justify-center px-4">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">
        Etiel Mining Hub Admin
      </h1>
      <LoginForm />
    </main>
  );
}
