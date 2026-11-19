import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Dashboard";

export const Route = createFileRoute("/dashboard/")({
  head: () => ({
    meta: [
      { title: "Dashboard | Coinly" },
      { name: "description", content: "Your portfolio, required actions and recovery status at a glance." },
      { property: "og:title", content: "Dashboard | Coinly" },
      { property: "og:description", content: "Your portfolio, required actions and recovery status at a glance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
