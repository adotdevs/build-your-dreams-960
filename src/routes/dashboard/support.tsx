import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Support";

export const Route = createFileRoute("/dashboard/support")({
  head: () => ({
    meta: [
      { title: "Support | Coinly" },
      { name: "description", content: "Contact the Coinly support team and track your tickets." },
      { property: "og:title", content: "Support | Coinly" },
      { property: "og:description", content: "Contact the Coinly support team and track your tickets." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
