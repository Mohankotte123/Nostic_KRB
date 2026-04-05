"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT } from "jose";
import { getJwtSecretKey } from "@/lib/auth/secret";
import { sessionCookieName } from "@/lib/auth/session";
import type { UserRole } from "@/lib/auth/session";

export type LoginState = { error?: string };

function resolveRole(
  username: string,
  password: string,
): UserRole | null {
  const mu = process.env.NOSTIC_MANAGER_USER?.trim();
  const mp = process.env.NOSTIC_MANAGER_PASS ?? "";
  const su = process.env.NOSTIC_STAFF_USER?.trim();
  const sp = process.env.NOSTIC_STAFF_PASS ?? "";

  if (mu && mp && username === mu && password === mp) return "manager";
  if (su && sp && username === su && password === sp) return "staff";

  const unset =
    !mu && !mp && !su && !sp && process.env.NODE_ENV !== "production";
  if (unset) {
    if (username === "manager" && password === "manager") return "manager";
    if (username === "cashier" && password === "cashier") return "staff";
  }
  return null;
}

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const remember = formData.get("remember") === "on";

  if (!username) {
    return { error: "Enter your username." };
  }
  if (!password) {
    return { error: "Enter your password." };
  }

  const role = resolveRole(username, password);
  if (!role) {
    return { error: "Invalid username or password." };
  }

  const maxAge = remember ? 60 * 60 * 24 * 7 : 60 * 60 * 8;

  const token = await new SignJWT({ sub: username, role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(remember ? "7d" : "8h")
    .sign(getJwtSecretKey());

  (await cookies()).set(sessionCookieName(), token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  });

  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  (await cookies()).delete(sessionCookieName());
  redirect("/login");
}
