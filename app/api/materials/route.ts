import { materials } from "../../data/catalog";
import { demoMeta } from "../../lib/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const category = url.searchParams.get("category");
  const query = url.searchParams.get("q")?.trim().toLowerCase() ?? "";
  const data = materials.filter((item) => (!category || item.category === category) && (!query || item.name.ar.toLowerCase().includes(query) || item.name.en.toLowerCase().includes(query) || item.specification.toLowerCase().includes(query)));
  return Response.json({ data, meta: demoMeta });
}
