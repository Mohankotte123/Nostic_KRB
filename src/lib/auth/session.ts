import "server-only";

import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { getJwtSecretKey } from "@/lib/auth/secret";

export type UserRole = "manager" | "staff";

export type SessionUser = {
  sub: string;
  role: UserRole;
};

const COOKIE = "nostic_session";

export function sessionCookieName(): string {
  return COOKIE;
}

export async function getSession(): Promise<SessionUser | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getJwtSecretKey());
    const role = payload.role;
    if (role !== "manager" && role !== "staff") return null;
    return { sub: String(payload.sub ?? ""), role };
  } catch {
    return null;
  }
}
