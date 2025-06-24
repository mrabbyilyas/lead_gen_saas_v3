import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Allow build to complete despite type errors for performance testing
    ignoreBuildErrors: true,
  },
  eslint: {
    // Allow build to complete despite ESLint warnings
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
