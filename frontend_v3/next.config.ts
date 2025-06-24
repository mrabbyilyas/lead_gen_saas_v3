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
  webpack: (config, { isServer }) => {
    // Exclude Node.js modules from client-side bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        dns: false,
        tls: false,
        crypto: false,
        os: false,
        path: false,
        stream: false,
      };
    }
    return config;
  },
  serverExternalPackages: ['pg'],
};

export default nextConfig;
