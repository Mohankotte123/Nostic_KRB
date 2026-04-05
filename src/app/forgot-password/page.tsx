import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0B0E14] px-4 py-12">
      <div
        className="pointer-events-none fixed inset-0 opacity-60"
        style={{
          backgroundImage:
            "radial-gradient(circle at 30% 20%, rgba(99,102,241,0.15), transparent 50%)",
        }}
      />
      <Card className="relative z-10 w-full max-w-md border-white/10 !bg-[#161B22]/75 backdrop-blur-[10px]">
        <CardHeader>
          <CardTitle>Reset access</CardTitle>
          <CardDescription className="text-zinc-400">
            Nostic Foods POS does not send automated reset emails. Contact your
            franchise administrator or IT contact to recover manager or staff
            credentials.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="/login"
            className="inline-flex h-11 w-full items-center justify-center rounded-[16px] bg-[#6366F1] text-sm font-bold text-white shadow-[0_0_24px_-6px_rgba(99,102,241,0.55)] transition-colors hover:bg-indigo-500"
          >
            Back to sign in
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
