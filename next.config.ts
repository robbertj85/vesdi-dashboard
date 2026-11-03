import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  // The demo dataset is read from disk at runtime by /api/demo; make sure it is
  // bundled when the app is traced for serverless/standalone output.
  outputFileTracingIncludes: {
    "/api/demo/**": ["./demo-data/**/*"],
  },
};

export default nextConfig;
