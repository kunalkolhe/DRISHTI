/**
 * Object storage — MinIO in dev (docker-compose already runs it), any
 * S3-compatible bucket in production (AWS S3, Cloudflare R2, DigitalOcean
 * Spaces, or MinIO again). Falls back to nothing here: if the MINIO_* env
 * vars aren't set, upload.ts writes to local disk instead — same pattern
 * this app already uses for email (SMTP_* unset → dummy mode).
 *
 * Uploaded photos are shown with no auth on public asset pages, in formal
 * complaint emails, and on QR-linked verify pages, so the bucket is
 * created public-read the first time it's used — the same visibility
 * local-disk files under /public/uploads already had.
 */
import {
  S3Client,
  PutObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
  PutBucketPolicyCommand,
} from "@aws-sdk/client-s3";

const endpoint = process.env.MINIO_URL;
const accessKeyId = process.env.MINIO_ACCESS_KEY;
const secretAccessKey = process.env.MINIO_SECRET_KEY;
const bucket = process.env.MINIO_BUCKET || "drishti-uploads";
// The URL browsers use to fetch objects — usually the same as MINIO_URL,
// but override with MINIO_PUBLIC_URL if the server reaches MinIO through a
// different address than the public internet does (e.g. an internal
// Docker hostname vs. a public domain in front of it).
const publicUrlBase = (process.env.MINIO_PUBLIC_URL || endpoint || "").replace(/\/+$/, "");

export const storageEnabled = Boolean(endpoint && accessKeyId && secretAccessKey);

let client: S3Client | null = null;
function getClient(): S3Client {
  if (!client) {
    client = new S3Client({
      endpoint,
      region: process.env.MINIO_REGION || "us-east-1",
      credentials: { accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey! },
      forcePathStyle: true, // required for MinIO and most non-AWS S3-compatible stores
    });
  }
  return client;
}

let bucketReady: Promise<void> | null = null;
function ensureBucket(): Promise<void> {
  if (!bucketReady) {
    bucketReady = (async () => {
      const c = getClient();
      try {
        await c.send(new HeadBucketCommand({ Bucket: bucket }));
      } catch {
        await c.send(new CreateBucketCommand({ Bucket: bucket }));
        const policy = {
          Version: "2012-10-17",
          Statement: [
            { Effect: "Allow", Principal: "*", Action: ["s3:GetObject"], Resource: [`arn:aws:s3:::${bucket}/*`] },
          ],
        };
        await c.send(new PutBucketPolicyCommand({ Bucket: bucket, Policy: JSON.stringify(policy) }));
      }
    })();
  }
  return bucketReady;
}

/** Uploads a buffer to the configured bucket and returns its public URL. */
export async function putObject(key: string, buffer: Buffer, contentType: string): Promise<string> {
  await ensureBucket();
  await getClient().send(
    new PutObjectCommand({ Bucket: bucket, Key: key, Body: buffer, ContentType: contentType }),
  );
  return `${publicUrlBase}/${bucket}/${key}`;
}
