import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/LegalNoticePage";

export const Route = createFileRoute("/legal")({
  head: () => ({
    meta: [
      { title: "Legal Notice | Coinly" },
      { name: "description", content: "Company information and legal disclosures for Coinly." },
      { property: "og:title", content: "Legal Notice | Coinly" },
      { property: "og:description", content: "Company information and legal disclosures for Coinly." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
