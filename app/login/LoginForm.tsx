"use client";

import { type FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeSlash, Envelope, Lock } from "@gravity-ui/icons";
import { Button, Form, Input } from "@heroui/react";
import { useAuth } from "@/context/AuthContext";
import { RankeaoLogo } from "@/components/icons/RankeaoLogo";
import { useTheme } from "next-themes";

export default function LoginForm() {
  const router = useRouter();
  const { login, status } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";

  useEffect(() => {
    if (status === "authenticated") router.replace("/");
  }, [status, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (!email.trim() || !password.trim()) {
      setError("Ingresa tu correo y contraseña.");
      return;
    }
    try {
      setIsSubmitting(true);
      await login({ email: email.trim(), password });
      router.replace("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo iniciar sesión.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: "var(--background)" }}>
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <RankeaoLogo className={`h-8 w-auto ${isDark ? "text-white" : "text-zinc-800"}`} />
          <p className="text-sm text-[var(--muted)]">Inicia sesión en tu cuenta</p>
        </div>

        {/* Card */}
        <div className="glass p-6 sm:p-8 space-y-6">
          <Form className="space-y-4" onSubmit={handleSubmit}>
            <div className="relative w-full">
              <Envelope className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[var(--muted)] pointer-events-none z-10" />
              <Input
                placeholder="correo@rankeao.cl"
                type="email"
                className="w-full h-12 pl-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="relative w-full">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[var(--muted)] pointer-events-none z-10" />
              <Input
                placeholder="Contraseña"
                type={isVisible ? "text" : "password"}
                className="w-full h-12 pl-10 pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors z-10 cursor-pointer"
                onClick={() => setIsVisible(!isVisible)}
              >
                {isVisible ? <Eye className="size-4" /> : <EyeSlash className="size-4" />}
              </button>
            </div>

            <div className="flex justify-end w-full">
              <Link href="/forgot-password" className="text-xs text-[var(--accent)] hover:underline font-medium">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            {error && (
              <div className="w-full px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-sm text-red-500">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 font-semibold rounded-xl bg-[var(--accent)] text-[var(--accent-foreground)]"
              isDisabled={isSubmitting}
            >
              {isSubmitting ? "Entrando..." : "Iniciar sesión"}
            </Button>
          </Form>
        </div>

        {/* Footer */}
        <div className="space-y-3 text-center">
          <p className="text-sm text-[var(--muted)]">
            ¿No tienes cuenta?{" "}
            <Link href="/register" className="text-[var(--accent)] hover:underline font-semibold">
              Registrate gratis
            </Link>
          </p>
          <Link href="/" className="block text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
            Continuar sin cuenta
          </Link>
        </div>
      </div>
    </div>
  );
}
