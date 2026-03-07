"use client";

import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@heroui/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <ToastProvider placement="top end" />
    </AuthProvider>
  );
}
