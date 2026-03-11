"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button, Card } from "@heroui/react";
import { verifyEmail, resendVerification } from "@/lib/api/auth";
import { useAuth } from "@/context/AuthContext";

export default function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const { session } = useAuth();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error" | "no-token">("loading");
  const [error, setError] = useState<string | null>(null);
  const [resendDone, setResendDone] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("no-token");
      return;
    }

    verifyEmail(token)
      .then(() => setStatus("success"))
      .catch((err) => {
        setStatus("error");
        setError(err instanceof Error ? err.message : "No se pudo verificar el email.");
      });
  }, [token]);

  const handleResend = async () => {
    const email = session?.email;
    if (!email) return;

    try {
      setResending(true);
      await resendVerification(email);
      setResendDone(true);
    } catch {
      setError("No se pudo reenviar el email de verificacion.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="rk-container py-14">
      <Card className="surface-panel max-w-md mx-auto">
        <Card.Content className="p-6 space-y-4">
          <p className="kicker">Verificacion</p>
          <h1 className="text-3xl font-bold text-white">Verificar email</h1>

          {status === "loading" && (
            <p className="text-sm text-gray-400">Verificando...</p>
          )}

          {status === "success" && (
            <>
              <p className="rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-300">
                Tu email ha sido verificado exitosamente.
              </p>
              <Link href="/">
                <Button className="w-full bg-gradient-to-r from-zinc-700 to-zinc-400 text-white font-semibold">
                  Ir al inicio
                </Button>
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {error || "El enlace es invalido o ha expirado."}
              </p>
              {session?.email && !resendDone && (
                <Button
                  className="w-full bg-gradient-to-r from-zinc-700 to-zinc-400 text-white font-semibold"
                  isDisabled={resending}
                  onPress={handleResend}
                >
                  {resending ? "Enviando..." : "Reenviar email de verificacion"}
                </Button>
              )}
              {resendDone && (
                <p className="text-sm text-gray-400">
                  Se envio un nuevo enlace a tu correo.
                </p>
              )}
            </>
          )}

          {status === "no-token" && (
            <>
              <p className="text-sm text-gray-400">
                No se encontro un token de verificacion. Revisa el enlace que recibiste por email.
              </p>
              {session?.email && !resendDone && (
                <Button
                  className="w-full bg-gradient-to-r from-zinc-700 to-zinc-400 text-white font-semibold"
                  isDisabled={resending}
                  onPress={handleResend}
                >
                  {resending ? "Enviando..." : "Reenviar email de verificacion"}
                </Button>
              )}
              {resendDone && (
                <p className="text-sm text-gray-400">
                  Se envio un nuevo enlace a tu correo.
                </p>
              )}
            </>
          )}
        </Card.Content>
      </Card>
    </div>
  );
}
