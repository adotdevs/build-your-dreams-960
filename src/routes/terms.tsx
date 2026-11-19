import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/TermsPage";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service | Coinly" },
      { name: "description", content: "Read the terms governing the use of the Coinly platform." },
      { property: "og:title", content: "Terms of Service | Coinly" },
      { property: "og:description", content: "Read the terms governing the use of the Coinly platform." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
