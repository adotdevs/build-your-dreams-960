import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/AdminSettings";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({
    meta: [
      { title: "Admin Settings | Coinly" },
      { name: "description", content: "Configure company branding, defaults and back office options." },
      { property: "og:title", content: "Admin Settings | Coinly" },
      { property: "og:description", content: "Configure company branding, defaults and back office options." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
