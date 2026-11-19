import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/platform/CompanyDetail";

export const Route = createFileRoute("/platform/companies/$companyId")({
  head: () => ({
    meta: [
      { title: "Company Detail | Coinly Platform" },
      { name: "description", content: "Company profile, admins and usage." },
      { property: "og:title", content: "Company Detail | Coinly Platform" },
      { property: "og:description", content: "Company profile, admins and usage." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
