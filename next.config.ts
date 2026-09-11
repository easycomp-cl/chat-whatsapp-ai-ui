import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Chats WhatsApp hasta 10 MB (+ overhead multipart)
      bodySizeLimit: "12mb",
    },
  },
  // Dev: menos ruido del poll de flow state (POST a /app/conversations/:id cada 2.5s).
  // Errores, compilación y requests a otras rutas siguen visibles.
  logging: {
    incomingRequests: {
      ignore: [/\/app\/conversations\/[^/]+$/],
    },
    serverFunctions: false,
  },
};

export default nextConfig;
