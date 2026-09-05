import fs from "fs/promises";
import path from "path";

/**
 * Saves an uploaded File to /public/uploads and returns its public path.
 * Local dev object-store stand-in — production uses MinIO / S3.
 * Server-only (uses `fs`).
 */
export async function saveUpload(file: File, prefix = "file"): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const base = (file.name || `${prefix}.jpg`).replace(/[^a-zA-Z0-9._-]/g, "");
  const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${base}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, name), buffer);
  return `/uploads/${name}`;
}
