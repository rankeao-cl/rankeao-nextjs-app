"use client";

import { AuthProvider } from "@/context/AuthContext";
import { Toast } from "@heroui/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <Toast.Provider placement="top end" />
    </AuthProvider>
  );
}
