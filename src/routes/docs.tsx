import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/DocumentationPage";

export const Route = createFileRoute("/docs")({
  head: () => ({
    meta: [
      { title: "Documentation | Coinly" },
      { name: "description", content: "Guides and reference material for using the Coinly platform." },
      { property: "og:title", content: "Documentation | Coinly" },
      { property: "og:description", content: "Guides and reference material for using the Coinly platform." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
