import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/CookiesPage";

export const Route = createFileRoute("/cookies")({
  head: () => ({
    meta: [
      { title: "Cookie Policy | Coinly" },
      { name: "description", content: "Details on the cookies and trackers used across Coinly." },
      { property: "og:title", content: "Cookie Policy | Coinly" },
      { property: "og:description", content: "Details on the cookies and trackers used across Coinly." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
