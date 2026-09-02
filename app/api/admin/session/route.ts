import { apiError, requireAdminUser } from "../../../lib/server";

export async function GET(request: Request) {
  try {
    const result = await requireAdminUser(request);
    if ("error" in result) return result.error;
    return Response.json({ authenticated: true, authorized: true, user: {
      id: result.stored.id,
      email: result.stored.email,
      displayName: result.stored.displayName,
      role: result.stored.role,
    } });
  } catch (error) { return apiError(error); }
}
