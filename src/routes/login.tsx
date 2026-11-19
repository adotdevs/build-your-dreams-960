import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Login";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign In | Coinly" },
      { name: "description", content: "Access your Coinly account to track balances, actions and recovery progress." },
      { property: "og:title", content: "Sign In | Coinly" },
      { property: "og:description", content: "Access your Coinly account to track balances, actions and recovery progress." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
