import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://crqjtgolagrknjkpbsdi.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_RJMj7P8RBqG5mo462Do2Ow_hbMQdR1M";

let client: SupabaseClient | null = null;

export function getSupabaseClient() {
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: "pkce",
      },
    });
  }
  return client;
}

export const supabaseProjectUrl = SUPABASE_URL;
