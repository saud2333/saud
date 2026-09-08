import { createHash } from "node:crypto";
import { officialUrl } from "./publication-policy.mjs";

export const MEDIA_BUCKET = "mirsad-official-images";
export const MAX_IMAGE_BYTES = 8_000_000;
const mimeExtensions = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif" };

export function decodeEmbeddedImage(mimeType, encoded) {
  if (mimeType === "image/jpg") mimeType = "image/jpeg";
  if (!mimeExtensions[mimeType] || encoded.length > Math.ceil(MAX_IMAGE_BYTES / 3) * 4 + 1024) return null;
  const base64 = encoded.replace(/\s/g, "");
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(base64) || base64.length % 4 !== 0) return null;
  const bytes = Buffer.from(base64, "base64");
  if (!bytes.length || bytes.length > MAX_IMAGE_BYTES || bytes.toString("base64") !== base64) return null;
  // KFAS labels some PNG files image/jpeg. Detect the bytes, not the label;
  // publish the identical bytes with their correct content type.
  const detected = bytes.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex")) ? "image/png"
    : bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff ? "image/jpeg"
    : /^(GIF87a|GIF89a)$/.test(bytes.subarray(0, 6).toString("ascii")) ? "image/gif"
    : bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP" ? "image/webp" : null;
  if (!detected) return null;
  return { mimeType: detected, base64, sha256: createHash("sha256").update(bytes).digest("hex") };
}

// Remove embedded PDFs before HTML parsing. Retain only bounded raster image
// payloads, which still have to occur in a visible <img> element to be selected.
export function compactEmbeddedPayloads(html) {
  const images = new Map();
  const text = html.replace(/data:([^;\s"']+);base64,([A-Za-z0-9+/=\r\n]+)/gi, (_, mime, encoded) => {
    const image = images.size < 32 ? decodeEmbeddedImage(mime.toLowerCase(), encoded) : null;
    if (!image) return "mirsad-omitted-binary:";
    const reference = `mirsad-embedded-image:${images.size}`;
    images.set(reference, image);
    return reference;
  });
  return { text, images };
}

const storageCode = (error) => String(error?.code ?? error?.statusCode ?? "request_failed");
const missingBucket = (error) => ["NoSuchBucket", "not_found", "404"].includes(storageCode(error));
const existingObject = (error) => ["ResourceAlreadyExists", "KeyAlreadyExists", "Duplicate", "already_exists", "409"].includes(storageCode(error))
  || (String(error?.statusCode) === "400" && /^(?:The resource|Asset) already exists\.?$/i.test(error?.message ?? ""));
const bucketChecks = new WeakMap();

async function ensureMediaBucket(client) {
  if (!bucketChecks.has(client)) {
    const check = (async () => {
      let result = await client.storage.getBucket(MEDIA_BUCKET);
      if (result.error && missingBucket(result.error)) {
        const created = await client.storage.createBucket(MEDIA_BUCKET, {
          public: true, allowedMimeTypes: Object.keys(mimeExtensions), fileSizeLimit: MAX_IMAGE_BYTES,
        });
        if (created.error && !["BucketAlreadyExists", "ResourceAlreadyExists", "409"].includes(storageCode(created.error))) throw new Error(`Official image storage setup failed (${storageCode(created.error)})`);
        result = await client.storage.getBucket(MEDIA_BUCKET);
      }
      if (result.error) throw new Error(`Official image storage unavailable (${storageCode(result.error)})`);
      // Never change the visibility of an existing bucket automatically.
      if (result.data?.public !== true) throw new Error("Official image bucket is not public");
    })();
    bucketChecks.set(client, check);
  }
  try { await bucketChecks.get(client); }
  catch (error) { bucketChecks.delete(client); throw error; }
}

export async function mirrorEmbeddedImages(document, source, client) {
  const { embeddedImages = [], ...clean } = document;
  const trustedMirrors = new Map();
  if (!embeddedImages.length) return { document: clean, trustedMirrors };
  if (document.channel !== "website" || !officialUrl(document.url, source) || !/^[a-z0-9-]+$/.test(source.key)) throw new Error("Embedded image is not from an official page");
  if (embeddedImages.length > 4) throw new Error("Too many embedded announcement images");
  const validated = embeddedImages.map((entry) => {
    const image = decodeEmbeddedImage(entry.mimeType, entry.base64);
    if (!image || image.sha256 !== entry.sha256) throw new Error("Invalid embedded announcement image");
    return image;
  });
  await ensureMediaBucket(client);
  const bucket = client.storage.from(MEDIA_BUCKET);
  const images = [...clean.images], imageProvenance = [];
  for (const image of validated) {
    const path = `${source.key}/${image.sha256}.${mimeExtensions[image.mimeType]}`;
    const { error } = await bucket.upload(path, Buffer.from(image.base64, "base64"), {
      contentType: image.mimeType, cacheControl: "31536000", upsert: false,
    });
    if (error && !existingObject(error)) throw new Error(`Official image upload failed (${storageCode(error)})`);
    const url = bucket.getPublicUrl(path).data.publicUrl;
    if (!/^https:\/\//.test(url)) throw new Error("Official image storage must use HTTPS");
    images.push(url);
    trustedMirrors.set(url, image.sha256);
    imageProvenance.push({ url, sourceUrl: document.url, sha256: image.sha256, kind: "embedded_official_image" });
  }
  return { document: { ...clean, images: [...new Set(images)].slice(0, 4), imageProvenance }, trustedMirrors };
}
