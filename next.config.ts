import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Pin the workspace root explicitly. Without this, Turbopack walks up
  // looking for the "real" root and can land on a stray package-lock.json
  // in the user's home directory, which prints a confusing warning.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
