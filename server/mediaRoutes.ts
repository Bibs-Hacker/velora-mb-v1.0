import express, { type Express, type Request, type Response } from "express";
import { ALLOWED_MEDIA_MIME_TYPES, IMAGE_MIME_TYPES, MEDIA_SCOPES, VELORA_BRAND, VIDEO_MIME_TYPES, type MediaScope } from "../shared/velora";
import { mediaAssets } from "../drizzle/schema";
import { sdk } from "./_core/sdk";
import { createId, requireDb } from "./db";
import { enforceRateLimit, sanitizePlainText } from "./services/platform";
import { storagePut } from "./storage";

function normalizeFileName(value: string) {
  const decoded = (() => {
    try { return decodeURIComponent(value); } catch { return value; }
  })();
  const safe = decoded.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-").slice(-120);
  return safe || "upload";
}

function isExpectedFileSignature(buffer: Buffer, mimeType: string) {
  if (mimeType === "image/jpeg") return buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (mimeType === "image/png") return buffer.length > 7 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (mimeType === "image/gif") return buffer.length > 5 && (buffer.subarray(0, 6).toString() === "GIF87a" || buffer.subarray(0, 6).toString() === "GIF89a");
  if (mimeType === "image/webp") return buffer.length > 11 && buffer.subarray(0, 4).toString() === "RIFF" && buffer.subarray(8, 12).toString() === "WEBP";
  if (mimeType === "video/webm" || mimeType === "audio/webm") return buffer.length > 3 && buffer.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
  if (mimeType === "application/pdf") return buffer.length > 4 && buffer.subarray(0, 5).toString() === "%PDF-";
  if (mimeType === "audio/ogg") return buffer.length > 3 && buffer.subarray(0, 4).toString() === "OggS";
  if (mimeType === "audio/mpeg") return buffer.length > 3 && (buffer.subarray(0, 3).toString() === "ID3" || (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0));
  if (VIDEO_MIME_TYPES.indexOf(mimeType as typeof VIDEO_MIME_TYPES[number]) !== -1 || mimeType === "audio/mp4") return buffer.length > 11 && buffer.subarray(4, 8).toString() === "ftyp";
  return false;
}

function hasExpectedExtension(fileName: string, mimeType: string) {
  const extension = fileName.split(".").pop()?.toLowerCase();
  const expected: Record<string, string[]> = {
    "image/jpeg": ["jpg", "jpeg"],
    "image/png": ["png"],
    "image/webp": ["webp"],
    "image/gif": ["gif"],
    "video/mp4": ["mp4"],
    "video/webm": ["webm"],
    "video/quicktime": ["mov"],
    "application/pdf": ["pdf"],
    "audio/webm": ["webm"],
    "audio/ogg": ["ogg"],
    "audio/mp4": ["m4a", "mp4"],
    "audio/mpeg": ["mp3"],
  };
  return Boolean(extension && expected[mimeType]?.indexOf(extension) !== -1);
}

async function uploadMedia(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    const scope = req.header("x-velora-media-scope") as MediaScope | undefined;
    const mimeType = (req.header("content-type") ?? "").split(";")[0].trim().toLowerCase();
    const originalName = normalizeFileName(req.header("x-velora-file-name") ?? "upload");
    const altText = sanitizePlainText(req.header("x-velora-alt-text") ?? "", 500);
    const body = req.body;

    if (!scope || MEDIA_SCOPES.indexOf(scope) === -1) return res.status(400).json({ error: "Invalid media scope." });
    if (ALLOWED_MEDIA_MIME_TYPES.indexOf(mimeType as typeof ALLOWED_MEDIA_MIME_TYPES[number]) === -1) return res.status(415).json({ error: "This file type is not supported." });
    if (!Buffer.isBuffer(body) || body.length === 0) return res.status(400).json({ error: "Select a file before uploading." });
    if (body.length > VELORA_BRAND.maxUploadBytes) return res.status(413).json({ error: "Files must be 50 MB or smaller." });
    if (!hasExpectedExtension(originalName, mimeType) || !isExpectedFileSignature(body, mimeType)) return res.status(415).json({ error: "File contents do not match the declared media type." });

    await enforceRateLimit(user.id, "media_upload", 20, 60 * 60 * 1000);
    const mediaId = createId("med_");
    const { key, url } = await storagePut(`velora/${user.id}/${scope}/${mediaId}-${originalName}`, body, mimeType);
    const db = await requireDb();
    await db.insert(mediaAssets).values({
      id: mediaId,
      ownerUserId: user.id,
      scope,
      storageKey: key,
      url,
      originalName,
      mimeType,
      sizeBytes: body.length,
      altText: altText || null,
    });
    const kind = IMAGE_MIME_TYPES.indexOf(mimeType as typeof IMAGE_MIME_TYPES[number]) !== -1 ? "image" : VIDEO_MIME_TYPES.indexOf(mimeType as typeof VIDEO_MIME_TYPES[number]) !== -1 ? "video" : mimeType.startsWith("audio/") ? "audio" : "document";
    return res.status(201).json({ id: mediaId, url, mimeType, originalName, sizeBytes: body.length, kind });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to upload this file.";
    const status = /wait before trying/i.test(message) ? 429 : 500;
    return res.status(status).json({ error: message });
  }
}

export function registerMediaRoutes(app: Express) {
  app.post(
    "/api/media/upload",
    express.raw({
      type: req => ALLOWED_MEDIA_MIME_TYPES.indexOf((req.headers["content-type"] ?? "").split(";")[0].toLowerCase() as typeof ALLOWED_MEDIA_MIME_TYPES[number]) !== -1,
      limit: VELORA_BRAND.maxUploadBytes,
    }),
    uploadMedia,
  );
}
