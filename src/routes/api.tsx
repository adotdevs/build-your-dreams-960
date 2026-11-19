import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/APIPage";

export const Route = createFileRoute("/api")({
  head: () => ({
    meta: [
      { title: "Developer API | Coinly" },
      { name: "description", content: "Integrate Coinly balances, transactions and actions through our REST API." },
      { property: "og:title", content: "Developer API | Coinly" },
      { property: "og:description", content: "Integrate Coinly balances, transactions and actions through our REST API." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
