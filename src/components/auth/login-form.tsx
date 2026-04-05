"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { loginAction, type LoginState } from "@/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NosticLogo } from "@/components/brand/nostic-logo";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [clientError, setClientError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    setClientError(null);
    if (!username.trim()) {
      e.preventDefault();
      setClientError("Enter your username.");
      return;
    }
    if (!password) {
      e.preventDefault();
      setClientError("Enter your password.");
      return;
    }
  }

  const error = clientError ?? state.error;

  const fieldClass =
    "h-11 rounded-[16px] border-white/15 bg-white/[0.06] text-zinc-100 placeholder:text-zinc-500";

  return (
    <div className="relative w-full max-w-md px-4">
      <div className="absolute inset-0 -z-10 rounded-[16px] bg-gradient-to-br from-indigo-500/20 via-emerald-500/10 to-transparent blur-3xl" />
      <div className="rounded-[16px] border border-white/10 bg-[#161B22]/70 p-8 shadow-2xl shadow-black/40 backdrop-blur-[10px]">
        <div className="mb-8 flex flex-col items-center text-center">
          <NosticLogo
            size="lg"
            priority
            className="object-center drop-shadow-[0_0_28px_rgba(255,255,255,0.12)]"
          />
          <p className="mt-4 text-sm text-zinc-500">Manager & staff sign in</p>
        </div>

        <form action={formAction} onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-zinc-300">
              Username
            </Label>
            <Input
              id="username"
              name="username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={fieldClass}
              placeholder="e.g. manager"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="password" className="text-zinc-300">
                Password
              </Label>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-indigo-400 hover:text-indigo-300 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={fieldClass}
            />
          </div>

          <label className="flex cursor-pointer items-center gap-2.5 text-sm text-zinc-400">
            <input
              type="checkbox"
              name="remember"
              className="size-4 rounded border-white/20 bg-white/10 text-[#10B981] focus:ring-[#10B981]"
            />
            Remember me on this device
          </label>

          {error ? (
            <p
              className="rounded-[16px] border border-red-500/35 bg-red-500/10 px-3 py-2 text-sm text-red-200"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          <Button
            type="submit"
            disabled={pending}
            className="h-11 w-full text-base font-bold shadow-[0_0_28px_-6px_rgba(16,185,129,0.55)]"
          >
            {pending ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-zinc-500">
          Inventory, reports, and settings require a manager account.
        </p>
      </div>
    </div>
  );
}
