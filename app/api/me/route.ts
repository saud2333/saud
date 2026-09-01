import { getRequestUser } from "../../lib/server";

export async function GET(request: Request) {
  const user = getRequestUser(request);
  if (!user) return Response.json({ authenticated: false, user: null }, { status: 401 });
  return Response.json({ authenticated: true, user });
}
