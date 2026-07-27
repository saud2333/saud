import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

type D1Client = Parameters<typeof drizzle>[0];

export function getDb(
  database = env.DB as D1Client | undefined,
) {
  if (!database) {
    throw new Error(
      "Cloudflare D1 binding `DB` is unavailable. Pass the binding to getDb() after setting the `d1` field in .openai/hosting.json."
    );
  }

  return drizzle(database, { schema });
}
