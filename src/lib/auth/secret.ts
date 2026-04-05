export function getJwtSecretKey(): Uint8Array {
  const s =
    process.env.NOSTIC_AUTH_SECRET ?? process.env.AUTH_SECRET ?? undefined;
  if (!s) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "Set NOSTIC_AUTH_SECRET (or AUTH_SECRET) in the environment for secure sessions.",
      );
    }
    return new TextEncoder().encode("nostic-dev-only-secret-change-me");
  }
  return new TextEncoder().encode(s);
}
