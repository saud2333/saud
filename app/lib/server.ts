import { getDb } from "../../db";
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
