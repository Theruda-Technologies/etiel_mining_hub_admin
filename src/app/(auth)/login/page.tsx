import { LoginForm } from "@/features/auth";

export default function LoginPage() {
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

      <footer className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-6 py-4 font-mono text-[10px] tracking-[0.12em] text-white/70 uppercase">
        <p>© 2024 Etiel Mining Hub. Operational Center.</p>
        <a href="mailto:support@etiel.mining" className="hover:text-accent">
          Technical Support
        </a>
      </footer>
    </main>
  );
}
