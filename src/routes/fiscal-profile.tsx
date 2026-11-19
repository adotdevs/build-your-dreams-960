import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/FiscalProfile";

export const Route = createFileRoute("/fiscal-profile")({
  head: () => ({
    meta: [
      { title: "Fiscal Profile | Coinly" },
      { name: "description", content: "Complete your fiscal profile to comply with tax and reporting requirements." },
      { property: "og:title", content: "Fiscal Profile | Coinly" },
      { property: "og:description", content: "Complete your fiscal profile to comply with tax and reporting requirements." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
