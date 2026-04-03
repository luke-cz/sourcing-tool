const SALT = "talentscout_v1";

export const SESSION_COOKIE = "ts_session";
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/** SHA-256 hash using Web Crypto API — works in both Edge and Node.js runtimes. */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${SALT}:${password}`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
