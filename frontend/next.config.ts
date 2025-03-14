import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'media.licdn.com',
        pathname: '/**',
      },
      {
        protocol: 'https', 
        hostname: 'randomuser.me',
        pathname: '/**',
      }
    ],
  },
};

export default nextConfig;
