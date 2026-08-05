import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
  experimental: {
    // Allow multipart image uploads through the proxy / server.
    proxyClientMaxBodySize: "6mb",
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
