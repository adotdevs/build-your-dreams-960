import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Transactions";

export const Route = createFileRoute("/dashboard/transactions")({
  head: () => ({
    meta: [
      { title: "Transactions | Coinly" },
      { name: "description", content: "Full history of deposits, withdrawals and recovery movements." },
      { property: "og:title", content: "Transactions | Coinly" },
      { property: "og:description", content: "Full history of deposits, withdrawals and recovery movements." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
