"use client";

import { type FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Form } from "@heroui/react";
import { useAuth } from "@/context/AuthContext";

export default function RegisterForm() {
  const router = useRouter();
  const { register, status } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

    if (!username.trim() || !email.trim() || !password.trim()) {
      setError("Completa nombre de usuario, correo y contrasena.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contrasenas no coinciden.");
      return;
    }

    try {
      setIsSubmitting(true);
      await register({
        username: username.trim(),
        email: email.trim(),
        password,
      });
      router.replace("/");
    } catch (submitError) {
      if (submitError instanceof Error) {
        setError(submitError.message);
      } else {
        setError("No se pudo completar el registro.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rk-container py-14">
      <Card className="surface-panel max-w-md mx-auto">
        <Card.Content className="p-6 space-y-4">
          <p className="kicker">Nuevo jugador</p>
          <h1 className="text-3xl font-bold text-white">Crear cuenta</h1>

          <Form className="space-y-3" onSubmit={handleSubmit}>
            <Input
              placeholder="Nombre de usuario"
              className="w-full"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
            />
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
            <Input
              placeholder="Confirmar contrasena"
              type="password"
              className="w-full"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />

            {error ? <p className="text-sm text-zinc-200">{error}</p> : null}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-zinc-700 to-zinc-400 text-white font-semibold"
              isDisabled={isSubmitting}
            >
              {isSubmitting ? "Registrando..." : "Registrarme gratis"}
            </Button>
          </Form>

          <p className="text-xs text-gray-400">
            Ya tienes cuenta?{" "}
            <Link href="/login" className="text-zinc-200 hover:text-zinc-100">
              Inicia sesion
            </Link>
          </p>
        </Card.Content>
      </Card>
    </div>
  );
}
