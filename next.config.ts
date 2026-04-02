import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "*.gravatar.com" },
      { protocol: "https", hostname: "media.licdn.com" },
      { protocol: "https", hostname: "dev-to-uploads.s3.amazonaws.com" },
    ],
  },
};

export default nextConfig;
