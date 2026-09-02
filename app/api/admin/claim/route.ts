import { count, eq } from "drizzle-orm";
import { users } from "../../../../db/schema";
import { apiError, constantTimeMatch, getAdminSetupCode, getRequestUser, getStoredUser } from "../../../lib/server";

export async function POST(request: Request) {
  const user = getRequestUser(request);
  if (!user) return Response.json({ error: "Authentication required", code: "unauthorized" }, { status: 401 });
  const payload = await request.json().catch(() => null) as { code?: string } | null;
  const submitted = payload?.code?.trim() ?? "";
  const expected = getAdminSetupCode();
  if (!expected) return Response.json({ error: "Admin setup is unavailable", code: "setup_unavailable" }, { status: 503 });
  try {
    const { db, stored } = await getStoredUser(user);
    if (stored.role === "admin") return Response.json({ claimed: true, alreadyAdmin: true });
    const [row] = await db.select({ value: count() }).from(users).where(eq(users.role, "admin"));
    if ((row?.value ?? 0) > 0) return Response.json({ error: "Admin access is already assigned", code: "already_claimed" }, { status: 409 });
    if (!await constantTimeMatch(submitted, expected)) return Response.json({ error: "Invalid access code", code: "invalid_code" }, { status: 403 });
    await db.update(users).set({ role: "admin", status: "active", updatedAt: new Date().toISOString() }).where(eq(users.id, user.id));
    return Response.json({ claimed: true });
  } catch (error) { return apiError(error); }
}
