import { Suspense } from "react";
import Navbar from "@/components/layout/Navbar";
import AppShell from "@/components/layout/AppShell";
import NavigationProgress from "@/components/layout/NavigationProgress";

export default function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Suspense fallback={null}><NavigationProgress /></Suspense>
      <Navbar />
      <AppShell>{children}</AppShell>
    </>
  );
}
