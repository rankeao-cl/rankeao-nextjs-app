"use client";

import { type FormEvent, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@heroui/react/button";
import { Card } from "@heroui/react/card";
import { Form } from "@heroui/react/form";
import { Input } from "@heroui/react/input";

import { Eye, EyeSlash } from "@gravity-ui/icons";
import { resetPassword } from "@/lib/api/auth";

export default function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  if (!token) {
    return (
      <div className="rk-container py-14">
        <Card className="surface-panel rounded-[22px] max-w-md mx-auto">
          <Card.Content className="p-6 space-y-4">
            <p className="kicker">Error</p>
            <h1 className="text-3xl font-bold text-foreground">Enlace invalido</h1>
            <p className="text-sm text-muted">
              El enlace no contiene un token valido. Solicita uno nuevo desde la pagina de recuperacion.
            </p>
            <Link href="/forgot-password">
              <Button className="w-full bg-[var(--accent)] text-[var(--accent-foreground)] font-semibold">
                Solicitar nuevo enlace
              </Button>
            </Link>
          </Card.Content>
        </Card>
      </div>
    );
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!password.trim()) {
      setError("Ingresa una nueva contrasena.");
      return;
    }

    if (password.length < 8) {
      setError("La contrasena debe tener al menos 8 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contrasenas no coinciden.");
      return;
    }

    try {
      setIsSubmitting(true);
      await resetPassword(token, password);
      setSuccess(true);
    } catch (submitError) {
      if (submitError instanceof Error) {
        setError(submitError.message);
      } else {
        setError("No se pudo restablecer la contrasena.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rk-container py-14">
      <Card className="surface-panel rounded-[22px] max-w-md mx-auto">
        <Card.Content className="p-6 space-y-4">
          <p className="kicker">Seguridad</p>
          <h1 className="text-3xl font-bold text-foreground">Nueva contrasena</h1>

          {success ? (
            <>
              <p className="rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-300">
                Tu contrasena ha sido actualizada. Ya puedes iniciar sesion.
              </p>
              <Link href="/login">
                <Button className="w-full bg-[var(--accent)] text-[var(--accent-foreground)] font-semibold">
                  Ir al login
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Form className="space-y-3" onSubmit={handleSubmit}>
                <div className="relative">
                  <Input
                    placeholder="Nueva contrasena"
                    type={isVisible ? "text" : "password"}
                    className="w-full pr-10"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                  <Button
                    isIconOnly
                    aria-label={isVisible ? "Hide password" : "Show password"}
                    size="sm"
                    variant="ghost"
                    className="absolute right-1 top-1/2 -translate-y-1/2"
                    onPress={() => setIsVisible(!isVisible)}
                  >
                    {isVisible ? <Eye className="size-4" /> : <EyeSlash className="size-4" />}
                  </Button>
                </div>

                <Input
                  placeholder="Confirmar contrasena"
                  type="password"
                  className="w-full"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                />

                {error ? <p className="text-sm text-foreground">{error}</p> : null}

                <Button
                  type="submit"
                  className="w-full bg-[var(--accent)] text-[var(--accent-foreground)] font-semibold"
                  isDisabled={isSubmitting}
                >
                  {isSubmitting ? "Actualizando..." : "Restablecer contrasena"}
                </Button>
              </Form>
            </>
          )}
        </Card.Content>
      </Card>
    </div>
  );
}
