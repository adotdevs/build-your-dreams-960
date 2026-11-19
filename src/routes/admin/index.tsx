import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/AdminDashboard";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard | Coinly" },
      { name: "description", content: "Back office overview of clients, tickets and agent activity." },
      { property: "og:title", content: "Admin Dashboard | Coinly" },
      { property: "og:description", content: "Back office overview of clients, tickets and agent activity." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
