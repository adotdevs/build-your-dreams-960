import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/AdminLogin";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [
      { title: "Admin Sign In | Coinly" },
      { name: "description", content: "Restricted access for Coinly back office staff." },
      { property: "og:title", content: "Admin Sign In | Coinly" },
      { property: "og:description", content: "Restricted access for Coinly back office staff." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
