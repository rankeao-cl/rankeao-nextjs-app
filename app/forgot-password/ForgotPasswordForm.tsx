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
          <h1 className="text-3xl font-bold text-white">Recuperar contrasena</h1>

          {sent ? (
            <>
              <p className="rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-300">
                Si el correo esta registrado, recibiras instrucciones para restablecer tu contrasena.
              </p>
              <Link href="/login">
                <Button className="w-full bg-gradient-to-r from-zinc-700 to-zinc-400 text-white font-semibold">
                  Volver al login
                </Button>
              </Link>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-400">
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

                {error ? <p className="text-sm text-zinc-200">{error}</p> : null}

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-zinc-700 to-zinc-400 text-white font-semibold"
                  isDisabled={isSubmitting}
                >
                  {isSubmitting ? "Enviando..." : "Enviar enlace"}
                </Button>
              </Form>

              <p className="text-xs text-gray-400">
                Recordaste tu contrasena?{" "}
                <Link href="/login" className="text-zinc-200 hover:text-zinc-100">
                  Inicia sesion
                </Link>
              </p>
            </>
          )}
        </Card.Content>
      </Card>
    </div>
  );
}
