/** The signing secret for sessions and one-time codes. Production refuses to run without a real one. */
export function secret(): string {
  const s = process.env.SATA_SESSION_SECRET;
  if (s && s.length >= 32) return s;
  if (process.env.NODE_ENV === "production") throw new Error("SATA_SESSION_SECRET must be set to a random string of at least 32 characters in production");
  return "dev-only-secret-change-me-dev-only-secret";
}
