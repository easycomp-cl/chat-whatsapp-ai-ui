import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Chats WhatsApp hasta 10 MB (+ overhead multipart)
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;
