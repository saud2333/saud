import { desc, eq } from "drizzle-orm";
import { roadReports } from "../../../db/schema";
import { apiError, ensureUser, getRequestUser } from "../../lib/server";

const allowedDefects = new Set(["Pothole", "Crack", "Rutting", "Surface Failure", "Drainage Problem", "Settlement", "Damaged Kerb"]);
const allowedSeverity = new Set(["low", "medium", "high"]);

export async function GET(request: Request) {
  const user = getRequestUser(request);
  if (!user) return Response.json({ error: "Authentication required", code: "unauthorized" }, { status: 401 });
  try {
    const db = await ensureUser(user);
    const data = await db.select().from(roadReports).where(eq(roadReports.reporterUserId, user.id)).orderBy(desc(roadReports.createdAt)).limit(50);
    return Response.json({ data });
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  const user = getRequestUser(request);
  if (!user) return Response.json({ error: "Authentication required", code: "unauthorized" }, { status: 401 });
  const payload = await request.json().catch(() => null) as { defectType?: string; location?: string; severity?: string; description?: string; imageObjectKey?: string } | null;
  if (!payload || !allowedDefects.has(payload.defectType ?? "") || !allowedSeverity.has(payload.severity ?? "") || !payload.location?.trim()) return Response.json({ error: "Valid defectType, location, and severity are required" }, { status: 400 });
  try {
    const db = await ensureUser(user);
    const [report] = await db.insert(roadReports).values({ reporterUserId: user.id, defectType: payload.defectType!, locationText: payload.location.trim().slice(0, 240), severity: payload.severity!, description: payload.description?.trim().slice(0, 2000) || null, imageObjectKey: payload.imageObjectKey?.trim() || null }).returning();
    return Response.json({ data: report }, { status: 201 });
  } catch (error) { return apiError(error); }
}
