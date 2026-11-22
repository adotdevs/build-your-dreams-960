import { Suspense } from "react";
import type { Metadata } from "next";
import AppShell from "@/components/app-shell";
import "@/styles.css";

export const metadata: Metadata = {
  title: "Cryptogen | Secure Crypto Asset Recovery",
  description: "Cryptogen is a regulated platform for recovering, tracking and withdrawing crypto assets.",
  icons: { icon: "/favicon.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" translate="no" className="notranslate" suppressHydrationWarning>
      <body translate="no" className="notranslate" suppressHydrationWarning>
        <Suspense fallback={null}>
          <AppShell>{children}</AppShell>
        </Suspense>
      </body>
    </html>
  );
}
