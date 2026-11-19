import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/ClientsList";

export const Route = createFileRoute("/admin/clients/")({
  head: () => ({
    meta: [
      { title: "Clients | Coinly Admin" },
      { name: "description", content: "Browse, search and manage all client accounts." },
      { property: "og:title", content: "Clients | Coinly Admin" },
      { property: "og:description", content: "Browse, search and manage all client accounts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
