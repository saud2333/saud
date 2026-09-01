import { demoMeta } from "../../lib/server";

export async function GET() {
  return Response.json({ data: [], meta: { ...demoMeta, notice: "Data unavailable until an official Kuwait project source is connected and reviewed." } });
}
