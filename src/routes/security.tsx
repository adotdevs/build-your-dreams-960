import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/SecurityPage";

export const Route = createFileRoute("/security")({
  head: () => ({
    meta: [
      { title: "Security | Coinly" },
      { name: "description", content: "How Coinly protects client funds, data and identities." },
      { property: "og:title", content: "Security | Coinly" },
      { property: "og:description", content: "How Coinly protects client funds, data and identities." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
