import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/platform/PlatformAnalytics";

export const Route = createFileRoute("/platform/analytics")({
  head: () => ({
    meta: [
      { title: "Platform Analytics | Coinly" },
      { name: "description", content: "Cross-company growth, revenue and activity metrics." },
      { property: "og:title", content: "Platform Analytics | Coinly" },
      { property: "og:description", content: "Cross-company growth, revenue and activity metrics." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
