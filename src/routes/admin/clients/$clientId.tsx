import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/ClientDetail";

export const Route = createFileRoute("/admin/clients/$clientId")({
  head: () => ({
    meta: [
      { title: "Client Detail | Coinly Admin" },
      { name: "description", content: "Full client profile, balances, actions and history." },
      { property: "og:title", content: "Client Detail | Coinly Admin" },
      { property: "og:description", content: "Full client profile, balances, actions and history." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
