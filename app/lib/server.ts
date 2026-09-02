import { getDb } from "../../db";
import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { users } from "../../db/schema";

export type RequestUser = { id: string; email: string | null; name: string | null };

export function getRequestUser(request: Request): RequestUser | null {
  const id = request.headers.get("oai-authenticated-user-id");
  if (!id) return null;
  const encodedName = request.headers.get("oai-authenticated-user-full-name");
  const nameEncoding = request.headers.get("oai-authenticated-user-full-name-encoding");
  let name: string | null = null;
  if (encodedName && nameEncoding === "percent-encoded-utf-8") {
    try { name = decodeURIComponent(encodedName); } catch { name = null; }
  }
  return { id, email: request.headers.get("oai-authenticated-user-email"), name };
}

export async function ensureUser(user: RequestUser) {
  const db = getDb();
  await db.insert(users).values({ id: user.id, email: user.email, displayName: user.name }).onConflictDoUpdate({ target: users.id, set: { email: user.email, displayName: user.name } });
  return db;
}

export async function getStoredUser(user: RequestUser) {
  const db = await ensureUser(user);
  const [stored] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
  return { db, stored };
}

export async function requireAdminUser(request: Request) {
  const user = getRequestUser(request);
  if (!user) return { error: Response.json({ error: "Authentication required", code: "unauthorized" }, { status: 401 }) } as const;
  const { db, stored } = await getStoredUser(user);
  if (!stored || stored.role !== "admin" || stored.status !== "active") {
    return { error: Response.json({ error: "Not found", code: "not_found" }, { status: 404 }) } as const;
  }
  return { user, stored, db } as const;
}

export function getAdminSetupCode() {
  const value = env.ADMIN_SETUP_CODE;
  return typeof value === "string" && value.length >= 16 ? value : null;
}

export async function constantTimeMatch(left: string, right: string) {
  const encoder = new TextEncoder();
  const [leftHash, rightHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(left)),
    crypto.subtle.digest("SHA-256", encoder.encode(right)),
  ]);
  const a = new Uint8Array(leftHash);
  const b = new Uint8Array(rightHash);
  let mismatch = a.length ^ b.length;
  for (let index = 0; index < Math.min(a.length, b.length); index += 1) mismatch |= a[index] ^ b[index];
  return mismatch === 0;
}

export function apiError(error: unknown, fallback = "Service temporarily unavailable") {
  const message = error instanceof Error ? error.message : fallback;
  const databaseUnavailable = /D1|no such table|binding/i.test(message);
  return Response.json({ error: databaseUnavailable ? "Persistent storage is not initialized in this environment." : fallback, code: databaseUnavailable ? "storage_unavailable" : "internal_error" }, { status: 503 });
}

export const demoMeta = {
  mode: "demo",
  source: null,
  last_updated: null,
  confidence: "unavailable",
  notice: "Demo records are placeholders and do not represent real people, companies, suppliers, projects, or market prices.",
};
