import { directoryRecords } from "../../data/catalog";
import { demoMeta } from "../../lib/server";

export async function GET() {
  return Response.json({ data: directoryRecords.filter((record) => record.kind === "supplier"), meta: demoMeta });
}
