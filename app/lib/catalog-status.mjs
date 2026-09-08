export function emptyCatalogMode(sources, now = Date.now()) {
  if (!sources?.length || sources.every((source) => !source.last_synced_at)) return "awaiting_sync";
  return sources.every((source) => {
    const checked = Date.parse(source.last_synced_at);
    return source.last_sync_status === "ok" && checked <= now && checked > now - 24 * 60 * 60_000;
  }) ? "live" : "unavailable";
}
