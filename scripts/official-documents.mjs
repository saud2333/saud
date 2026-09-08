import { officialUrl } from "./publication-policy.mjs";
import { createHash } from "node:crypto";
import { compactEmbeddedPayloads } from "./embedded-media.mjs";

// Accounts verified against these official pages on 2026-09-05.
// KISR Instagram remains unconnected: only an older printed handle was found.
export const socialSources = {
  kgbc: { proof: "https://www.kuwaitgbc.com/home", instagram: "kuwaitgbc" },
  kfas: { proof: "https://apply.kfas.org.kw/", instagram: "kfasinfo", x: "kfasinfo", youtube: "UCW3oVwg7_mQ-_FOwmgYNyYg" },
  kisr: { proof: "https://www.kisr.edu.kw/en/", x: "kisrofficial", youtube: "UC-RW8QO_nkdR-5MhHNB4-eQ" },
  sacgc: { proof: "https://sacgc.org/en/", instagram: "sacgc_kw", x: "sacgc_kw", youtube: "UCMypXENNolyFNLyrRYUjRXQ" },
};

export function decodeText(value = "") {
  return String(value).replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&#(x[\da-f]+|\d+);/gi, (_, number) => {
      const point = number[0].toLowerCase() === "x" ? parseInt(number.slice(1), 16) : Number(number);
      return point >= 0 && point <= 0x10ffff ? String.fromCodePoint(point) : "";
    })
    .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&apos;|&#39;/g, "'")
    .replace(/&nbsp;/g, " ").replace(/&ndash;/g, "–").replace(/&mdash;/g, "—")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}

function textOnly(html) {
  return decodeText(html.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

const announcementImageUrl = (url, source) => officialUrl(url, source)
  && !/logo|icon|avatar|flag|loader|loading|spinner|\.svg(?:[?#]|$)/i.test(url);

export async function boundedText(response, maxBytes = 2_000_000) {
  if (Number(response.headers.get("content-length")) > maxBytes) { await response.body?.cancel(); throw new Error("Source exceeds size limit"); }
  const reader = response.body.getReader();
  const chunks = []; let size = 0;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) { await reader.cancel(); throw new Error("Source exceeds size limit"); }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString("utf8");
}

export async function fetchOfficialPage(url, source, fetchImpl = fetch) {
  let destination = url;
  for (let hop = 0; hop < 5; hop++) {
    if (!officialUrl(destination, source)) throw new Error("Off-domain official page rejected");
    const response = await fetchImpl(destination, { redirect: "manual", signal: AbortSignal.timeout(25_000), headers: { "user-agent": "MirsadCourseBot/2.0 (+https://github.com/saud2333/saud)" } });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) throw new Error("Redirect without destination");
      destination = new URL(location, destination).href; continue;
    }
    if (!response.ok) throw new Error(`Official page HTTP ${response.status}`);
    if (!/text\/html|application\/xhtml/i.test(response.headers.get("content-type") ?? "")) throw new Error("Source needs a supported HTML page");
    // The KFAS application portal embeds entire brochures in its HTML.
    // Keep the exception bounded and restricted to that verified portal.
    const maxBytes = source.key === "kfas" && new URL(destination).hostname === "apply.kfas.org.kw" ? 40_000_000 : 2_000_000;
    return { ...htmlDocument(await boundedText(response, maxBytes), destination, source), requestedUrl: url };
  }
  throw new Error("Too many official page redirects");
}

export async function withImageHashes(document, source, fetchImpl = fetch, trustedMirrors = new Map()) {
  const imageHashes = await Promise.all(document.images.map(async (url) => {
    const host = new URL(url).hostname;
    const socialImage = document.channel !== "website" && (host === "i.ytimg.com" || host === "pbs.twimg.com" || host.endsWith(".cdninstagram.com") || host.endsWith(".fbcdn.net"));
    const expectedMirrorHash = trustedMirrors.get(url);
    if (!officialUrl(url, source) && !socialImage && !expectedMirrorHash) throw new Error("Untrusted image source");
    const response = await fetchImpl(url, { redirect: "error", signal: AbortSignal.timeout(20_000) });
    if (!response.ok || !/^image\/(jpeg|png|webp|gif)(?:;|$)/i.test(response.headers.get("content-type") ?? "")) throw new Error("Announcement image unavailable");
    const reader = response.body.getReader(), hash = createHash("sha256"); let size = 0;
    for (;;) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > 8_000_000) { await reader.cancel(); throw new Error("Announcement image too large"); }
      hash.update(value);
    }
    const digest = hash.digest("hex");
    if (expectedMirrorHash && digest !== expectedMirrorHash) throw new Error("Stored image does not match the official source");
    return digest;
  }));
  return { ...document, imageHashes };
}

export function htmlDocument(html, url, source) {
  const compact = compactEmbeddedPayloads(html);
  const body = compact.text.replace(/<(style|nav|header|footer|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<script\b(?![^>]*application\/ld\+json)[^>]*>[\s\S]*?<\/script>/gi, " ");
  const links = [];
  const images = [];
  const embeddedImages = [];
  const candidates = [];
  for (const match of body.matchAll(/<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    try {
      const destination = new URL(decodeText(match[1]), url);
      destination.hash = "";
      const href = destination.href;
      if (!officialUrl(href, source)) continue;
      links.push(href);
      if (href !== url && !/\/(?:User\/Login|login|logout|subscribe)(?:[/?#]|$)/i.test(destination.pathname)
        && /دور|ورش|تدريب|تسجيل|برنامج|course|workshop|training|register|apply|offer|event|program|FormDetails/i.test(href + " " + textOnly(match[2]))
        && !/\.(pdf|zip|docx?)(?:[?#]|$)/i.test(href)) candidates.push(href);
    } catch { /* Ignore malformed links. */ }
  }
  for (const match of body.matchAll(/<img\b[^>]*(?:src|data-src)\s*=\s*["']([^"']+)["'][^>]*>/gi)) {
    try {
      const embedded = compact.images.get(match[1]);
      if (embedded) {
        if (!embeddedImages.some((image) => image.sha256 === embedded.sha256)) embeddedImages.push(embedded);
        continue;
      }
      const image = new URL(decodeText(match[1]), url).href;
      if (announcementImageUrl(image, source)) images.push(image);
    } catch { /* Ignore malformed image URLs. */ }
  }
  for (const match of compact.text.matchAll(/<meta\b[^>]*>/gi)) {
    const attributes = Object.fromEntries([...match[0].matchAll(/([\w:-]+)\s*=\s*["']([^"']*)["']/g)].map((attribute) => [attribute[1].toLowerCase(), decodeText(attribute[2])]));
    if (attributes.property === "og:image" && attributes.content) {
      try { const image = new URL(attributes.content, url).href; if (announcementImageUrl(image, source)) images.push(image); } catch { /* malformed metadata */ }
    }
  }
  for (const match of body.matchAll(/"(url|image)"\s*:\s*"([^"\n]+)"/g)) {
    try {
      const value = new URL(decodeText(match[2]), url).href;
      if (match[1] === "image" ? announcementImageUrl(value, source) : officialUrl(value, source)) (match[1] === "image" ? images : links).push(value);
    } catch { /* malformed structured URL */ }
  }
  // Prefer the page's embedded offer image over unrelated external decoration.
  const selectedEmbedded = embeddedImages.slice(0, 4);
  return { url, text: textOnly(body).slice(0, 30_000), links: [...new Set([url, ...links])], images: [...new Set(images)].slice(0, 4 - selectedEmbedded.length),
    ...(selectedEmbedded.length ? { embeddedImages: selectedEmbedded } : {}), candidates: [...new Set(candidates)], channel: "website" };
}

const xmlValue = (entry, tag) => decodeText(entry.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`))?.[1] ?? "");

export function parseYoutubeFeed(xml, source, social) {
  const channel = xmlValue(xml.split("<entry>")[0], "yt:channelId");
  if (channel !== social.youtube) throw new Error("Unexpected YouTube channel");
  return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map((match) => {
    const entry = match[1], id = xmlValue(entry, "yt:videoId");
    if (!/^[\w-]{11}$/.test(id)) return null;
    const text = `${xmlValue(entry, "title")}\n${xmlValue(entry, "media:description")}`;
    const images = [...entry.matchAll(/<media:thumbnail\b[^>]*url="([^"]+)"/g)].map((item) => decodeText(item[1])).filter((image) => /^https:\/\/i\.ytimg\.com\//.test(image));
    return { url: `https://www.youtube.com/watch?v=${id}`, text, images: images.slice(0, 4), links: (text.match(/https:\/\/[^\s<>"']+/g) ?? []).filter((link) => officialUrl(link, source)), candidates: [], channel: "youtube", accountUrl: `https://www.youtube.com/channel/${social.youtube}`, accountProofUrl: social.proof };
  }).filter(Boolean);
}

async function apiJson(url, token, fetchImpl) {
  const response = await fetchImpl(url, { redirect: "error", headers: { authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(25_000) });
  if (!response.ok) throw new Error(`Social API HTTP ${response.status}`);
  return JSON.parse(await boundedText(response));
}

async function xDocuments(source, social, env, fetchImpl) {
  const user = await apiJson(`https://api.x.com/2/users/by/username/${social.x}`, env.X_BEARER_TOKEN, fetchImpl);
  if (user.data?.username?.toLowerCase() !== social.x || !/^\d+$/.test(user.data.id)) throw new Error("Unexpected X account");
  const url = new URL(`https://api.x.com/2/users/${user.data.id}/tweets`);
  url.search = new URLSearchParams({ max_results: "100", exclude: "retweets,replies", "tweet.fields": "created_at,entities,attachments,author_id", expansions: "attachments.media_keys", "media.fields": "url,type" }).toString();
  const feed = await apiJson(url.href, env.X_BEARER_TOKEN, fetchImpl);
  if (feed.errors?.length) throw new Error("Partial X timeline response");
  return (feed.data ?? []).filter((post) => post.author_id === user.data.id && /^\d+$/.test(post.id)).map((post) => ({
    url: `https://x.com/${social.x}/status/${post.id}`, text: post.text,
    links: (post.entities?.urls ?? []).map((link) => link.expanded_url).filter((link) => officialUrl(link, source)),
    images: (feed.includes?.media ?? []).filter((item) => item.type === "photo" && post.attachments?.media_keys?.includes(item.media_key)).map((item) => item.url).filter((url) => /^https:\/\/pbs\.twimg\.com\//.test(url)).slice(0, 4),
    candidates: [], channel: "x", accountUrl: `https://x.com/${social.x}`, accountProofUrl: social.proof,
  }));
}

async function instagramDocuments(source, social, env, fetchImpl) {
  if (!/^v\d+\.\d+$/.test(env.META_GRAPH_VERSION) || !/^\d+$/.test(env.INSTAGRAM_BUSINESS_ACCOUNT_ID)) throw new Error("Invalid Instagram API configuration");
  const url = new URL(`https://graph.facebook.com/${env.META_GRAPH_VERSION}/${env.INSTAGRAM_BUSINESS_ACCOUNT_ID}`);
  url.searchParams.set("fields", `business_discovery.username(${social.instagram}){username,media.limit(50){id,caption,media_type,media_url,permalink,timestamp,children{media_type,media_url}}}`);
  const feed = await apiJson(url.href, env.META_ACCESS_TOKEN, fetchImpl);
  const profile = feed.business_discovery;
  if (profile?.username?.toLowerCase() !== social.instagram) throw new Error("Unexpected Instagram account");
  return (profile.media?.data ?? []).filter((post) => /^https:\/\/(www\.)?instagram\.com\/(p|reel)\/[\w-]+\/?$/.test(post.permalink)).map((post) => ({
    url: post.permalink, text: post.caption ?? "",
    links: ((post.caption ?? "").match(/https:\/\/[^\s<>"']+/g) ?? []).filter((link) => officialUrl(link, source)),
    images: [post, ...(post.children?.data ?? [])].filter((item) => item.media_type === "IMAGE").map((item) => item.media_url).filter((url) => /^https:\/\/[^/]+\.(cdninstagram\.com|fbcdn\.net)\//.test(url)).slice(0, 4),
    candidates: [], channel: "instagram", accountUrl: `https://www.instagram.com/${social.instagram}/`, accountProofUrl: social.proof,
  }));
}

export async function collectSocialDocuments(source, env = process.env, fetchImpl = fetch) {
  const social = socialSources[source.key];
  if (!social) return { documents: [], channels: [] };
  const channels = [], documents = [];
  const tasks = [
    ["youtube", social.youtube, true, async () => {
      const response = await fetchImpl(`https://www.youtube.com/feeds/videos.xml?channel_id=${social.youtube}`, { redirect: "error", signal: AbortSignal.timeout(25_000) });
      if (!response.ok) throw new Error(`YouTube feed HTTP ${response.status}`);
      return parseYoutubeFeed(await boundedText(response), source, social);
    }],
    ["x", social.x, Boolean(env.X_BEARER_TOKEN), () => xDocuments(source, social, env, fetchImpl)],
    ["instagram", social.instagram, Boolean(env.META_ACCESS_TOKEN && env.INSTAGRAM_BUSINESS_ACCOUNT_ID && env.META_GRAPH_VERSION), () => instagramDocuments(source, social, env, fetchImpl)],
  ];
  await Promise.all(tasks.map(async ([channel, account, configured, collect]) => {
    if (!account) { channels.push({ channel, status: "unverified_account" }); return; }
    if (!configured) { channels.push({ channel, status: "not_configured" }); return; }
    try { const result = await collect(); documents.push(...result); channels.push({ channel, status: "ok", count: result.length }); }
    catch (error) { channels.push({ channel, status: "failed", message: error.message }); }
  }));
  return { documents, channels };
}
