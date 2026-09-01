import { materials } from "../../../data/catalog";
import { demoMeta } from "../../../lib/server";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const material = materials.find((item) => item.id === id);
  if (!material) return Response.json({ error: "Material not found" }, { status: 404 });
  return Response.json({ data: { ...material, price_history: [] }, meta: demoMeta });
}
