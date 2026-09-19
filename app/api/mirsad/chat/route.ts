// Retired: saved FAQ answers are served locally, with no AI usage.
export async function POST() {
  return Response.json({ error: "chat_retired" }, { status: 410, headers: { "Cache-Control": "no-store" } });
}
