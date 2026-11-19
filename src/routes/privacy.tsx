import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/PrivacyPage";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy | Coinly" },
      { name: "description", content: "How Coinly collects, uses and protects personal data." },
      { property: "og:title", content: "Privacy Policy | Coinly" },
      { property: "og:description", content: "How Coinly collects, uses and protects personal data." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
