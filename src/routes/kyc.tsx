import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/KYC";

export const Route = createFileRoute("/kyc")({
  head: () => ({
    meta: [
      { title: "Identity Verification | Coinly" },
      { name: "description", content: "Verify your identity to unlock withdrawals and full account access." },
      { property: "og:title", content: "Identity Verification | Coinly" },
      { property: "og:description", content: "Verify your identity to unlock withdrawals and full account access." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
