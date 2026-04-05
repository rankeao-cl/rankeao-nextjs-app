"use client";

import { type FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Envelope, CircleCheck, ArrowLeft } from "@gravity-ui/icons";
import { Button } from "@heroui/react/button";
import { Form } from "@heroui/react/form";
import { Input } from "@heroui/react/input";

import { forgotPassword } from "@/lib/api/auth";
import { RankeaoLogo } from "@/components/icons/RankeaoLogo";
import { useTheme } from "next-themes";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError("Ingresa tu correo electrónico.");
      return;
    }
    try {
      setIsSubmitting(true);
      await forgotPassword(email.trim());
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo enviar el correo.");
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
          <p className="text-sm text-[var(--muted)]">Recuperar acceso a tu cuenta</p>
        </div>

        {/* Card */}
        <div className="glass p-6 sm:p-8 space-y-6">
          {sent ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-16 h-16 rounded-full bg-[var(--success)]/15 flex items-center justify-center">
                <CircleCheck className="size-8 text-[var(--success)]" />
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-lg font-bold text-[var(--foreground)]">Correo enviado</h2>
                <p className="text-sm text-[var(--muted)] leading-relaxed">
                  Si <span className="font-medium text-[var(--foreground)]">{email}</span> está registrado, recibirás instrucciones para restablecer tu contraseña.
                </p>
              </div>
              <Link href="/login" className="w-full">
                <Button className="w-full h-12 font-semibold rounded-xl bg-[var(--accent)] text-[var(--accent-foreground)]">
                  Volver al login
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <h2 className="text-lg font-bold text-[var(--foreground)]">Recuperar contraseña</h2>
                <p className="text-sm text-[var(--muted)]">
                  Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
                </p>
              </div>

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
                  {isSubmitting ? "Enviando..." : "Enviar enlace de recuperación"}
                </Button>
              </Form>
            </>
          )}
        </div>

        {/* Footer */}
        <Link href="/login" className="flex items-center justify-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
          <ArrowLeft className="size-4" />
          Volver al inicio de sesión
        </Link>
      </div>
    </div>
  );
}
