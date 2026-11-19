import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/TicketDetail";

export const Route = createFileRoute("/admin/support/$ticketId")({
  head: () => ({
    meta: [
      { title: "Ticket Detail | Coinly Admin" },
      { name: "description", content: "Read and reply to a client support conversation." },
      { property: "og:title", content: "Ticket Detail | Coinly Admin" },
      { property: "og:description", content: "Read and reply to a client support conversation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
