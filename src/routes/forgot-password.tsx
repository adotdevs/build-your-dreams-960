import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/ForgotPassword";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset Password | Coinly" },
      { name: "description", content: "Request a password reset link for your Coinly account." },
      { property: "og:title", content: "Reset Password | Coinly" },
      { property: "og:description", content: "Request a password reset link for your Coinly account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
