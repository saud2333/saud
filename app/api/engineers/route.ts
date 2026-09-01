import { directoryRecords } from "../../data/catalog";
import { demoMeta } from "../../lib/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const specialty = url.searchParams.get("specialty")?.toLowerCase();
  const area = url.searchParams.get("area")?.toLowerCase();
  const data = directoryRecords.filter((record) => record.kind === "engineer" && (!specialty || record.specialty.ar.toLowerCase().includes(specialty) || record.specialty.en.toLowerCase().includes(specialty)) && (!area || record.area.ar.toLowerCase().includes(area) || record.area.en.toLowerCase().includes(area)));
  return Response.json({ data, meta: demoMeta });
}
