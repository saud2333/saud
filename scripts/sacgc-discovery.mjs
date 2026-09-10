import { boundedText } from "./official-documents.mjs";

// Read only the published catalog used by the official TCB website. Never
// query profiles, registrations, internal notes, or authenticated resources.
export async function discoverSacgcCatalog(fetchImpl = fetch) {
  const origin = "https://tcbclubs.sacgc.org";
  const backend = "https://rebfugmitjhgxysxmhou.supabase.co";
  const get = async (url, headers = {}) => {
    const response = await fetchImpl(url, { headers, redirect: "error", signal: AbortSignal.timeout(25_000) });
    if (!response.ok) throw new Error(`TCB public catalog HTTP ${response.status}`);
    return boundedText(response, 8_000_000);
  };
  const html = await get(origin + "/");
  const asset = html.match(/src=["'](\/assets\/index-[\w-]+\.js)["']/)?.[1];
  if (!asset) throw new Error("TCB catalog template changed");
  const script = await get(origin + asset);
  if (!script.includes(backend)) throw new Error("TCB catalog backend changed");
  const key = (script.match(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g) ?? []).find(value => {
    try { const payload = JSON.parse(Buffer.from(value.split(".")[1], "base64url")); return payload.role === "anon" && payload.ref === "rebfugmitjhgxysxmhou"; } catch { return false; }
  });
  if (!key) throw new Error("TCB public catalog key unavailable");
  const definitions = [
    ["courses", "id,name,short_description,start_date,end_date,start_time,end_time,location,min_age,max_age,price_type,price,discount_price,kuwaitis_only,selected_dates,feature_image_url"],
    ["workshops", "id,name,name_ar,description,description_ar,start_date,end_date,start_time,end_time,location,min_age,max_age,audience_label,image_url"],
  ];
  const rows = [];
  for (const [table, fields] of definitions) {
    const params = new URLSearchParams({ select: fields, is_published: "eq.true", order: "start_date.asc", limit: "200" });
    const data = JSON.parse(await get(`${backend}/rest/v1/${table}?${params}`, { apikey: key, Authorization: `Bearer ${key}` }));
    if (!Array.isArray(data)) throw new Error("TCB catalog response changed");
    rows.push(...data.map(row => ({ ...row, catalog_type: table })));
  }
  // TCB currently publishes start dates but no registration deadline. Retain
  // the announcements as evidence for review, never invent that deadline.
  return { url: origin + "/", channel: "website", text: JSON.stringify(rows), images: [], links: [origin + "/"], candidates: [], structuredData: [],
    discoveredAnnouncements: rows, publicationHold: "registration_deadline_not_published", officialApplicationAsset: origin + asset };
}
