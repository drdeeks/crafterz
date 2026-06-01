import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Expose VERCEL_PROJECT_PRODUCTION_URL to client-side code
  env: {
    NEXT_PUBLIC_VERCEL_PRODUCTION_URL:
      process.env.VERCEL_PROJECT_PRODUCTION_URL,
  },
  allowedDevOrigins: [
    "*.ngrok.app",
    "*.neynar.com",
    "*.neynar.app",
    "*.studio.neynar.com",
    "*.dev-studio.neynar.com",
    "*.nip.io",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.imgur.com",
      },
      {
        protocol: "https",
        hostname: "neynar-public.s3.us-east-1.amazonaws.com",
      },
    ],
  },
  devIndicators: false,
  reactCompiler: true,
  ...(process.env.DISABLE_TURBOPACK_ROOT
    ? {}
    : {
        turbopack: {
          root: process.env.TURBOPACK_ROOT || path.resolve(__dirname),
        },
      }),
};

export default nextConfig;
