import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/ResetPassword";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set New Password | Coinly" },
      { name: "description", content: "Choose a new password for your Coinly account." },
      { property: "og:title", content: "Set New Password | Coinly" },
      { property: "og:description", content: "Choose a new password for your Coinly account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
