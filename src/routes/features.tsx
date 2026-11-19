import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/FeaturesPage";

export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: "Features | Coinly" },
      { name: "description", content: "Explore Coinly's recovery workflow, custody, reporting and compliance features." },
      { property: "og:title", content: "Features | Coinly" },
      { property: "og:description", content: "Explore Coinly's recovery workflow, custody, reporting and compliance features." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
