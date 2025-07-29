import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.danbing.ai',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
