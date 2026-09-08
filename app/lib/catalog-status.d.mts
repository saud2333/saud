export function emptyCatalogMode(sources: { last_synced_at: string | null; last_sync_status: string | null }[] | null, now?: number): "live" | "awaiting_sync" | "unavailable";
