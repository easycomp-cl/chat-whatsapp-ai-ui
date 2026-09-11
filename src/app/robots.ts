import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    "https://chat-whatsapp-ai-ui-gwzr-2p56rpz5i.vercel.app";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/app/", "/admin/", "/api/"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
