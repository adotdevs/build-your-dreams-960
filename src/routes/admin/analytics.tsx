import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/AgentAnalytics";

export const Route = createFileRoute("/admin/analytics")({
  head: () => ({
    meta: [
      { title: "Agent Analytics | Coinly Admin" },
      { name: "description", content: "Performance metrics for support and recovery agents." },
      { property: "og:title", content: "Agent Analytics | Coinly Admin" },
      { property: "og:description", content: "Performance metrics for support and recovery agents." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
