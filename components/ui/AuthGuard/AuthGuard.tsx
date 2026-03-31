"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth-store";
import RankeaoSpinner from "@/components/ui/RankeaoSpinner";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated()) { router.replace("/login"); return; }
    setChecked(true);
  }, [hasHydrated, isAuthenticated, accessToken, router]);

  if (!checked) return <div className="flex items-center justify-center h-screen w-full"><RankeaoSpinner className="h-10 w-auto" /></div>;
  return <>{children}</>;
}
