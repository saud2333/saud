import { env, type R2Bucket } from "cloudflare:workers";
import { documents } from "../../../../db/schema";
import { apiError, ensureUser, getRequestUser } from "../../../lib/server";

const allowedTypes = new Set(["application/pdf", "text/csv", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "image/jpeg", "image/png", "image/webp"]);
const maxBytes = 10 * 1024 * 1024;

export async function POST(request: Request) {
  const user = getRequestUser(request);
  if (!user) return Response.json({ error: "Authentication required", code: "unauthorized" }, { status: 401 });
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return Response.json({ error: "file is required" }, { status: 400 });
  if (!allowedTypes.has(file.type) || file.size > maxBytes) return Response.json({ error: "Unsupported type or file larger than 10 MB" }, { status: 400 });
  const bucket = env.FILES as R2Bucket | undefined;
  if (!bucket) return Response.json({ error: "File storage is not initialized", code: "storage_unavailable" }, { status: 503 });
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(-120);
  const key = `users/${encodeURIComponent(user.id)}/${crypto.randomUUID()}-${safeName}`;
  try {
    await bucket.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type }, customMetadata: { owner: user.id } });
    const db = await ensureUser(user);
    const [record] = await db.insert(documents).values({ ownerUserId: user.id, objectKey: key, filename: file.name.slice(0, 240), contentType: file.type, byteSize: file.size }).returning();
    return Response.json({ data: record }, { status: 201 });
  } catch (error) { return apiError(error); }
}
