import type { NextConfig } from "next";
import path from "path";

// When object storage is configured (src/lib/storage.ts), uploaded photos
// are served from that host instead of this app's own /public/uploads —
// next/image refuses to load an external host unless it's allow-listed.
const objectStoreUrl = process.env.MINIO_PUBLIC_URL || process.env.MINIO_URL;
const objectStorePattern = (() => {
  if (!objectStoreUrl) return null;
  try {
    const u = new URL(objectStoreUrl);
    return {
      protocol: u.protocol.replace(":", "") as "http" | "https",
      hostname: u.hostname,
      port: u.port || undefined,
      pathname: "/**",
    };
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  // Pin the workspace root explicitly. Without this, Turbopack walks up
  // looking for the "real" root and can land on a stray package-lock.json
  // in the user's home directory, which prints a confusing warning.
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    remotePatterns: objectStorePattern ? [objectStorePattern] : [],
  },
};

export default nextConfig;
