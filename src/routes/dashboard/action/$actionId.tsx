import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/ActionDetail";

export const Route = createFileRoute("/dashboard/action/$actionId")({
  head: () => ({
    meta: [
      { title: "Required Action | Coinly" },
      { name: "description", content: "Complete the requested step to continue your recovery process." },
      { property: "og:title", content: "Required Action | Coinly" },
      { property: "og:description", content: "Complete the requested step to continue your recovery process." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
