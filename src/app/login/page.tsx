import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0B0E14] px-4 py-12">
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99,102,241,0.22), transparent), radial-gradient(ellipse 60% 40% at 100% 100%, rgba(16,185,129,0.12), transparent), radial-gradient(ellipse 50% 30% at 0% 80%, rgba(99,102,241,0.1), transparent)",
        }}
      />
      <LoginForm />
    </div>
  );
}
