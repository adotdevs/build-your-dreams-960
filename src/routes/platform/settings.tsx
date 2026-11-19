import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/platform/PlatformSettings";

export const Route = createFileRoute("/platform/settings")({
  head: () => ({
    meta: [
      { title: "Platform Settings | Coinly" },
      { name: "description", content: "Global configuration for the Coinly platform." },
      { property: "og:title", content: "Platform Settings | Coinly" },
      { property: "og:description", content: "Global configuration for the Coinly platform." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
