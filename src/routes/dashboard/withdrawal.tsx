import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/BankWithdrawal";

export const Route = createFileRoute("/dashboard/withdrawal")({
  head: () => ({
    meta: [
      { title: "Bank Withdrawal | Coinly" },
      { name: "description", content: "Request a withdrawal of recovered funds to your bank account." },
      { property: "og:title", content: "Bank Withdrawal | Coinly" },
      { property: "og:description", content: "Request a withdrawal of recovered funds to your bank account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
