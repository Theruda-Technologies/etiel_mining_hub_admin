import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";
import { LoginFooter } from "../login/login-footer";

export default function ResetPasswordPage() {
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
        <ResetPasswordForm />
      </div>

      <LoginFooter />
    </main>
  );
}
