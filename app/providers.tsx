"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/context/AuthContext";
import { CreatePostModalProvider } from "@/context/CreatePostModalContext";
import { NotificationSidebarProvider } from "@/context/NotificationSidebarContext";
import { PWAProvider } from "@/context/PWAContext";
import { Toast } from "@heroui/react";
import { ThemeProvider } from "next-themes";
import dynamic from "next/dynamic";

const OfflineIndicator = dynamic(() => import("@/components/OfflineIndicator"), { ssr: false });
const PWAInstallBanner = dynamic(() => import("@/components/PWAInstallBanner"), { ssr: false });

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationSidebarProvider>
        <CreatePostModalProvider>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
            <PWAProvider>
              {children}
              <OfflineIndicator />
              <PWAInstallBanner />
              <Toast.Provider placement="top end" />
            </PWAProvider>
          </ThemeProvider>
        </CreatePostModalProvider>
        </NotificationSidebarProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
