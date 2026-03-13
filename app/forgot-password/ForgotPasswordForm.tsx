"use client";

import { type FormEvent, useState } from "react";
import Link from "next/link";
import { Button, Card, Form, Input } from "@heroui/react";
import { forgotPassword } from "@/lib/api/auth";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Ingresa tu correo electronico.");
      return;
    }

    try {
      setIsSubmitting(true);
      await forgotPassword(email.trim());
      setSent(true);
    } catch (submitError) {
      if (submitError instanceof Error) {
        setError(submitError.message);
      } else {
        setError("No se pudo enviar el correo.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rk-container py-14">
      <Card className="surface-panel max-w-md mx-auto">
        <Card.Content className="p-6 space-y-4">
          <p className="kicker">Recuperacion</p>
          <h1 className="text-3xl font-bold text-[var(--foreground)]">Recuperar contrasena</h1>

          {sent ? (
            <>
              <p className="rounded-lg border border-[var(--success)]/30 bg-[var(--success)]/10 px-3 py-2 text-sm text-[var(--success-foreground)]">
                Si el correo esta registrado, recibiras instrucciones para restablecer tu contrasena.
              </p>
              <Link href="/login">
                <Button className="w-full" variant="primary">
                  Volver al login
                </Button>
              </Link>
            </>
          ) : (
            <>
              <p className="text-sm text-[var(--muted)]">
                Ingresa tu correo y te enviaremos un enlace para restablecer tu contrasena.
              </p>

              <Form className="space-y-3" onSubmit={handleSubmit}>
                <Input
                  placeholder="usuario@rankeao.cl"
                  type="email"
                  className="w-full"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />

                {error ? <p className="text-sm text-[var(--muted)]">{error}</p> : null}

                <Button
                  type="submit"
                  className="w-full"
                  variant="primary"
                  isDisabled={isSubmitting}
                >
                  {isSubmitting ? "Enviando..." : "Enviar enlace"}
                </Button>
              </Form>

              <div className="flex flex-col gap-2 mt-6 items-center w-full">
                <Link href="/login" className="text-xs text-accent-glow hover:underline font-semibold text-center">
                  Recordaste tu contraseña? Inicia sesión
                </Link>
              </div>
            </>
          )}
        </Card.Content>
      </Card>
    </div>
  );
}
