// Print a transactional setup for a missing catalog without old demonstration rows.
// Run this output in the selected project's Supabase SQL Editor. No keys required.
import { readFile } from "node:fs/promises";

console.log(await readFile(new URL("../supabase/catalog-initial-setup.sql", import.meta.url), "utf8"));
