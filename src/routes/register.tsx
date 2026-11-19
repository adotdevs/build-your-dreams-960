import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Register";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create Account | Coinly" },
      { name: "description", content: "Open a Coinly account and start your secure asset recovery process." },
      { property: "og:title", content: "Create Account | Coinly" },
      { property: "og:description", content: "Open a Coinly account and start your secure asset recovery process." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
