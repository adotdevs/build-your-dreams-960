import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/AdminActivityLogs";

export const Route = createFileRoute("/admin/logs")({
  head: () => ({
    meta: [
      { title: "Activity Logs | Coinly Admin" },
      { name: "description", content: "Audit trail of every back office action." },
      { property: "og:title", content: "Activity Logs | Coinly Admin" },
      { property: "og:description", content: "Audit trail of every back office action." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
