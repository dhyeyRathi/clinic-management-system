import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["recharts", "victory-vendor"],
  turbopack: {
    resolveAlias: {
      "d3-scale": "victory-vendor/lib-vendor/d3-scale",
    }
  }
};

export default nextConfig;
