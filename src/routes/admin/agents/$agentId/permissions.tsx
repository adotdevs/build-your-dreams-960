import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/AgentPermissions";

export const Route = createFileRoute("/admin/agents/$agentId/permissions")({
  head: () => ({
    meta: [
      { title: "Agent Permissions | Coinly Admin" },
      { name: "description", content: "Fine-grained permission control for a back office agent." },
      { property: "og:title", content: "Agent Permissions | Coinly Admin" },
      { property: "og:description", content: "Fine-grained permission control for a back office agent." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
