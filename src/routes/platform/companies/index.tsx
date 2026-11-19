import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/platform/CompaniesList";

export const Route = createFileRoute("/platform/companies/")({
  head: () => ({
    meta: [
      { title: "Companies | Coinly Platform" },
      { name: "description", content: "All companies operating on the platform." },
      { property: "og:title", content: "Companies | Coinly Platform" },
      { property: "og:description", content: "All companies operating on the platform." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
