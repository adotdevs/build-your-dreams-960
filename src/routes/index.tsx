import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Index";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Coinly | Secure Crypto Asset Recovery Platform" },
      { name: "description", content: "Recover and manage your crypto assets securely with Coinly's regulated recovery and custody platform." },
      { property: "og:title", content: "Coinly | Secure Crypto Asset Recovery Platform" },
      { property: "og:description", content: "Recover and manage your crypto assets securely with Coinly's regulated recovery and custody platform." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
