import fs from "fs/promises";
import path from "path";
import { storageEnabled, putObject } from "@/lib/storage";

/**
 * Saves an uploaded File and returns its public URL. Goes to the
 * MinIO/S3 bucket configured in src/lib/storage.ts when MINIO_* env vars
 * are set (survives redeploys); falls back to /public/uploads on local
 * disk otherwise, so a fresh clone with no object store configured still
 * works.
 *
 * Validates size + MIME type before ever touching storage, and never
 * trusts the browser-supplied filename: the saved name is always
 * `<timestamp>-<random>.<ext>`, where `<ext>` comes from a fixed
 * MIME→extension map, not from user input. That closes the classic
 * "upload evil.svg / disguised.php.jpg" stored-XSS / RCE path.
 */

export class UploadError extends Error {}

type UploadKind = "image" | "audio";

const LIMITS: Record<UploadKind, { maxBytes: number; ext: Record<string, string> }> = {
  image: {
    maxBytes: 8 * 1024 * 1024, // 8 MB — plenty for a phone-camera JPEG
    ext: {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/heic": "heic",
      "image/heif": "heif",
    },
  },
  audio: {
    maxBytes: 15 * 1024 * 1024, // 15 MB — a few minutes of voice note
    ext: {
      "audio/webm": "webm",
      "audio/ogg": "ogg",
      "audio/mpeg": "mp3",
      "audio/mp4": "m4a",
      "audio/wav": "wav",
      "audio/wave": "wav",
      "audio/x-wav": "wav",
    },
  },
};

export async function saveUpload(file: File, kind: UploadKind): Promise<string> {
  if (!file || file.size === 0) {
    throw new UploadError("The file is empty.");
  }

  const { maxBytes, ext } = LIMITS[kind];
  if (file.size > maxBytes) {
    throw new UploadError(`File is too large — max ${Math.round(maxBytes / (1024 * 1024))}MB.`);
  }

  const extension = ext[file.type];
  if (!extension) {
    throw new UploadError(
      kind === "image"
        ? "Unsupported image format — use JPEG, PNG, WEBP or HEIC."
        : "Unsupported audio format.",
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}.${extension}`;

  if (storageEnabled) {
    return putObject(`uploads/${name}`, buffer, file.type);
  }

  const dir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, name), buffer);
  return `/uploads/${name}`;
}

/**
 * Same as saveUpload, but returns null for a missing/empty file and
 * re-throws UploadError as a plain string message — for call sites that
 * want a `{ success: false, error }` result instead of a try/catch.
 */
export async function saveUploadOrNull(
  file: File | null | undefined,
  kind: UploadKind,
): Promise<string | null> {
  if (!file || file.size === 0) return null;
  return saveUpload(file, kind);
}
