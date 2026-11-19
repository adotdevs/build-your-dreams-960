import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/HelpCenterPage";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Help Center | Coinly" },
      { name: "description", content: "Answers to common questions about recovery, withdrawals and verification." },
      { property: "og:title", content: "Help Center | Coinly" },
      { property: "og:description", content: "Answers to common questions about recovery, withdrawals and verification." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
