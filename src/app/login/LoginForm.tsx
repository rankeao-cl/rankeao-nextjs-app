"use client";

import { type FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card, CardContent, Input, Form } from "@heroui/react";
import { useAuth } from "@/context/AuthContext";

export default function LoginForm() {
  const router = useRouter();
  const { login, session, status } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      <Card className="surface-panel max-w-md mx-auto">
        <CardContent className="p-6 space-y-4">
          <p className="kicker">Acceso</p>
          <h1 className="text-3xl font-bold text-white">Iniciar sesion</h1>

          {status === "authenticated" && session?.email ? (
            <p className="rounded-lg border border-zinc-300/30 bg-zinc-300/10 px-3 py-2 text-sm text-zinc-100">
              Sesion activa como {session.email}
            </p>
          ) : null}

          <Form className="space-y-3" onSubmit={handleSubmit}>
            <Input
              placeholder="Correo"
              type="email"
              className="w-full"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            <Input
              placeholder="Contrasena"
              type="password"
              className="w-full"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />

            {error ? <p className="text-sm text-zinc-200">{error}</p> : null}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-zinc-700 to-zinc-400 text-white font-semibold"
              isDisabled={isSubmitting}
            >
              {isSubmitting ? "Entrando..." : "Entrar"}
            </Button>
          </Form>

          <p className="text-xs text-gray-400">
            No tienes cuenta?{" "}
            <Link href="/register" className="text-zinc-200 hover:text-zinc-100">
              Registrate aqui
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
