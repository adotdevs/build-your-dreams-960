"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import RequestBar from "@/components/request-bar";
import { AuthProvider } from "@/hooks/useAuth";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import ScrollToTop from "@/components/ScrollToTop";
import SupportChat from "@/components/support/SupportChat";
import "@/i18n/config";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <>
      <RequestBar />
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <ScrollToTop />
            {children}
            <SupportChat />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </>
  );
}
