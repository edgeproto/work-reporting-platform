import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

// Slightly above MAX_UPLOAD_BYTES (10 MB) to allow multipart overhead in Server Actions.
const serverActionBodySizeLimit = "12mb";

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    root: projectRoot,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: serverActionBodySizeLimit,
    },
  },
};

export default nextConfig;
