"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/use-auth";
import { Spinner } from "@heroui/react/spinner";


/** Decode JWT payload and extract a field */
function getJwtField(token: string | undefined, field: string): string | undefined {
  if (!token) return undefined;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return undefined;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload[field] as string | undefined;
  } catch {
    return undefined;
  }
}

export default function PerfilMePage() {
  const { session, status } = useAuth();
  const router = useRouter();

  const isAuthenticated = status === "authenticated" && Boolean(session?.email);

  // Get username from session or decode from JWT ("usr" field)
  const username = session?.username || getJwtField(session?.accessToken, "usr");

  useEffect(() => {
    if (status === "loading") return;
    if (isAuthenticated && username) {
      router.replace(`/perfil/${encodeURIComponent(username)}`);
    }
  }, [status, isAuthenticated, username, router]);

  if (isAuthenticated && username) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-[var(--muted)]">Redirigiendo a tu perfil...</p>
        </div>
      </div>
    );
  }

  if (status === "loading" || isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-[var(--muted)]">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4 text-center px-4">
        <p className="text-lg font-semibold text-[var(--foreground)]">Inicia sesión o regístrate para ver tu perfil</p>
        <div className="flex gap-3">
          <Link href="/login" className="text-sm font-semibold text-[var(--accent)] hover:underline">
            Iniciar sesión
          </Link>
          <span className="text-sm text-[var(--muted)]">|</span>
          <Link href="/register" className="text-sm font-semibold text-[var(--accent)] hover:underline">
            Registrarse
          </Link>
        </div>
      </div>
    </div>
  );
}
