import { eq } from "drizzle-orm";
import { users } from "../../../db/schema";
import { apiError, getRequestUser, getStoredUser } from "../../lib/server";

const clean = (value: unknown, length: number) => typeof value === "string" ? value.trim().slice(0, length) : null;

export async function GET(request: Request) {
  const user = getRequestUser(request);
  if (!user) return Response.json({ authenticated: false, user: null }, { status: 401 });
  try {
    const { stored } = await getStoredUser(user);
    return Response.json({ authenticated: true, user: stored });
  } catch (error) { return apiError(error); }
}

export async function PUT(request: Request) {
  const user = getRequestUser(request);
  if (!user) return Response.json({ error: "Authentication required", code: "unauthorized" }, { status: 401 });
  const payload = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!payload) return Response.json({ error: "Invalid profile data" }, { status: 400 });
  const locale = payload.locale === "en" ? "en" : "ar";
  const theme = ["light", "dark", "system"].includes(String(payload.theme)) ? payload.theme as "light" | "dark" | "system" : "system";
  try {
    const { db } = await getStoredUser(user);
    const [updated] = await db.update(users).set({
      displayName: clean(payload.displayName, 100) || user.name || user.email,
      jobTitle: clean(payload.jobTitle, 100),
      company: clean(payload.company, 120),
      phone: clean(payload.phone, 30),
      governorate: clean(payload.governorate, 60),
      bio: clean(payload.bio, 500),
      locale,
      theme,
      updatedAt: new Date().toISOString(),
    }).where(eq(users.id, user.id)).returning();
    return Response.json({ data: updated });
  } catch (error) { return apiError(error); }
}
