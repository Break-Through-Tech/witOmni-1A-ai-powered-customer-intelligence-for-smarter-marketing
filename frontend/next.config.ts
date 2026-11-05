import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // lib/data.ts reads these at runtime, so make sure they ship with every route.
  outputFileTracingIncludes: {
    "/*": ["./data/**/*.json"],
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
