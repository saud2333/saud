import { desc, eq } from "drizzle-orm";
import { projects } from "../../../db/schema";
import { apiError, ensureUser, getRequestUser } from "../../lib/server";

export async function GET(request: Request) {
  const user = getRequestUser(request);
  if (!user) return Response.json({ error: "Authentication required", code: "unauthorized" }, { status: 401 });
  try {
    const db = await ensureUser(user);
    const data = await db.select().from(projects).where(eq(projects.ownerUserId, user.id)).orderBy(desc(projects.updatedAt)).limit(50);
    return Response.json({ data });
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  const user = getRequestUser(request);
  if (!user) return Response.json({ error: "Authentication required", code: "unauthorized" }, { status: 401 });
  const payload = await request.json().catch(() => null) as { name?: string; projectType?: string; area?: string; budget?: number } | null;
  const name = payload?.name?.trim();
  const projectType = payload?.projectType?.trim();
  if (!name || !projectType || name.length > 120) return Response.json({ error: "name and projectType are required" }, { status: 400 });
  try {
    const db = await ensureUser(user);
    const [project] = await db.insert(projects).values({ ownerUserId: user.id, name, projectType, area: payload?.area?.trim() || null, budget: typeof payload?.budget === "number" && payload.budget >= 0 ? payload.budget : null }).returning();
    return Response.json({ data: project }, { status: 201 });
  } catch (error) { return apiError(error); }
}
