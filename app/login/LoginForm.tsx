"use client";

import { type FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Envelope, Eye, EyeSlash, Lock } from "@gravity-ui/icons";
import { Button, Card, Form, Input } from "@heroui/react";
import { useAuth } from "@/context/AuthContext";

export default function LoginForm() {
  const router = useRouter();
  const { login, session, status } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/");
    }
  }, [status, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError("Debes ingresar correo y contrasena.");
      return;
    }

    try {
      setIsSubmitting(true);
      await login({
        email: email.trim(),
        password,
      });
      router.replace("/");
    } catch (submitError) {
      if (submitError instanceof Error) {
        setError(submitError.message);
      } else if (
        typeof submitError === "object" &&
        submitError !== null
      ) {
        const maybeError = submitError as { message?: string; error?: string };
        setError(
          maybeError.message ||
          maybeError.error ||
          JSON.stringify(submitError)
        );
      } else {
        setError("No se pudo iniciar sesión.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rk-container py-14">
      <Card className="surface-panel rounded-[22px] max-w-md mx-auto">
        <Card.Content className="p-6 space-y-4">
          <p className="kicker">Acceso</p>
          <h1 className="text-3xl font-bold text-foreground">Iniciar sesión</h1>

          {status === "authenticated" && session?.email ? (
            <p className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-secondary)] px-3 py-2 text-sm text-foreground">
              Sesión activa como {session.email}
            </p>
          ) : null}

          <Form className="space-y-3" onSubmit={handleSubmit}>
            <Input
              placeholder="usuario@rankeao.cl"
              type="email"
              className="w-full [&_input]:h-12"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />

            <div className="relative">
              <Input
                placeholder="••••••••"
                type={isVisible ? "text" : "password"}
                className="w-full pr-10 [&_input]:h-12"
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
                {isVisible ? <Eye className="size-4 text-foreground" /> : <EyeSlash className="size-4 text-foreground" />}
              </Button>
            </div>

            {error ? <p className="text-sm text-danger">{error}</p> : null}

            <Button
              type="submit"
              className="w-full h-12 font-semibold bg-[color:var(--accent)] text-[color:var(--accent-foreground)] hover:bg-[color:var(--accent-subtle)]"
              isDisabled={isSubmitting}
            >
              {isSubmitting ? "Entrando..." : "Entrar"}
            </Button>
          </Form>

          <div className="flex flex-col gap-2 mt-6 items-center w-full">
            <Link href="/forgot-password" className="text-sm py-2 text-accent-glow hover:underline font-semibold text-center">
              Olvidé mi contraseña
            </Link>
            <div className="text-sm text-muted text-center">
              No tienes cuenta?{' '}
              <Link href="/register" className="py-2 text-accent-glow hover:underline font-semibold">
                Regístrate
              </Link>
            </div>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
}
