import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/platform/PlatformDashboard";

export const Route = createFileRoute("/platform/")({
  head: () => ({
    meta: [
      { title: "Platform Overview | Coinly" },
      { name: "description", content: "Multi-company platform control centre." },
      { property: "og:title", content: "Platform Overview | Coinly" },
      { property: "og:description", content: "Multi-company platform control centre." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
