import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  // Served under prototype.transportlab.app/vesdi-dashboard in production
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || undefined,
  output: "standalone",
  // Serve both /vesdi-dashboard and /vesdi-dashboard/: Nginx Proxy Manager
  // locations end in "/" and would otherwise redirect-loop with Next.
  skipTrailingSlashRedirect: true,
  // Data lives on volumes in production (DEMO_DATA_DIR, SURVEY_DATA_DIR,
  // ROUTE_CACHE_DIR). Never trace local copies into the build output: they
  // hold confidential CBS data and personal data.
  outputFileTracingExcludes: {
    "*": ["./demo-data/**/*", "./data/**/*", "./Utrecht/**/*", "./Amsterdam/**/*", "./Almere/**/*",
      "./Den Haag/**/*", "./Rotterdam/**/*", "./Zwolle/**/*", "./screenshots/**/*", "./routing/**/*"],
  },
};

export default nextConfig;
