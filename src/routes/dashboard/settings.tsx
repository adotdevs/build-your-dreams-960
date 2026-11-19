import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Settings";

export const Route = createFileRoute("/dashboard/settings")({
  head: () => ({
    meta: [
      { title: "Account Settings | Coinly" },
      { name: "description", content: "Manage your profile, security and notification preferences." },
      { property: "og:title", content: "Account Settings | Coinly" },
      { property: "og:description", content: "Manage your profile, security and notification preferences." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
