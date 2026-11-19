import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Wallet";

export const Route = createFileRoute("/dashboard/wallet")({
  head: () => ({
    meta: [
      { title: "Wallet | Coinly" },
      { name: "description", content: "View balances, deposit addresses and blocked funds." },
      { property: "og:title", content: "Wallet | Coinly" },
      { property: "og:description", content: "View balances, deposit addresses and blocked funds." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
