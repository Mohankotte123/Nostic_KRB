import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getSession();

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-white">
          Settings
        </h1>
        <p className="text-sm text-zinc-500">
          Account and workspace preferences.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between gap-4 border-b border-white/10 py-2">
            <span className="text-zinc-500">Username</span>
            <span className="font-semibold text-zinc-100">
              {session?.sub ?? "—"}
            </span>
          </div>
          <div className="flex justify-between gap-4 border-b border-white/10 py-2">
            <span className="text-zinc-500">Role</span>
            <span className="capitalize text-zinc-200">{session?.role ?? "—"}</span>
          </div>
          <p className="pt-2 text-xs leading-relaxed text-zinc-500">
            Password resets and SSO are managed by your franchise administrator.
            Use &quot;Forgot password&quot; on the sign-in screen for recovery
            instructions.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
