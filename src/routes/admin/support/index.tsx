import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/SupportTickets";

export const Route = createFileRoute("/admin/support/")({
  head: () => ({
    meta: [
      { title: "Support Tickets | Coinly Admin" },
      { name: "description", content: "Queue of open and resolved client support conversations." },
      { property: "og:title", content: "Support Tickets | Coinly Admin" },
      { property: "og:description", content: "Queue of open and resolved client support conversations." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
