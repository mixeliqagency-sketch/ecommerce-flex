import type { MetadataRoute } from "next";
import { themeConfig } from "@/theme.config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/checkout/", "/cuenta/", "/tracking/", "/auth/"],
      },
      // Permitir explícitamente bots de LLMs para aparecer en respuestas de IA
      { userAgent: "GPTBot", allow: "/" },
      { userAgent: "PerplexityBot", allow: "/" },
      { userAgent: "ClaudeBot", allow: "/" },
      { userAgent: "Google-Extended", allow: "/" },
    ],
    sitemap: `${themeConfig.brand.url}/sitemap.xml`,
  };
}
