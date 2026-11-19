import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/AgentsList";

export const Route = createFileRoute("/admin/agents/")({
  head: () => ({
    meta: [
      { title: "Agents | Coinly Admin" },
      { name: "description", content: "Manage back office agents and their access." },
      { property: "og:title", content: "Agents | Coinly Admin" },
      { property: "og:description", content: "Manage back office agents and their access." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
