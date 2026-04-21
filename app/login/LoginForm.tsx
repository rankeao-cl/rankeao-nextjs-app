"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeSlash, Envelope, Lock } from "@gravity-ui/icons";
import { Button } from "@heroui/react/button";
import { Input } from "@heroui/react/input";
import { motion } from "framer-motion";

import { useAuth } from "@/lib/hooks/use-auth";
import { RankeaoLogo } from "@/components/icons/RankeaoLogo";
import IconDiscord from "@/components/icons/IconDiscord";
import LoginBackground from "./LoginBackground";

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || "https://api.rankeao.cl/api/v1").replace(/\/api\/v1\/?$/, "");

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  cancelled: "Cancelaste el inicio de sesión con Discord.",
  no_email: "Discord no compartió tu email. Intentá de nuevo aceptando los permisos.",
  invalid_state: "La sesión expiró. Intentá de nuevo.",
  unavailable: "Discord OAuth no está disponible temporalmente.",
  already_linked: "Esa cuenta de Discord ya está vinculada a otro usuario de Rankeao.",
};

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, status } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const oauthErrorMessage = useMemo(() => {
    const code = searchParams?.get("oauth_error");
    if (!code) return null;
    return OAUTH_ERROR_MESSAGES[code] ?? "No se pudo iniciar sesión con Discord. Intentá de nuevo.";
  }, [searchParams]);

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
    <div className="login-scene">
      <LoginBackground />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12">
        <motion.div
          className="w-full max-w-sm space-y-8"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Logo */}
          <div className="flex flex-col items-center gap-3">
            <RankeaoLogo className="h-8 w-auto text-white drop-shadow-lg" />
            <p className="text-sm text-white/60">Inicia sesión en tu cuenta</p>
          </div>

          {/* Card */}
          <div className="login-card p-6 sm:p-8 space-y-6">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="relative w-full">
                <Envelope className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/40 pointer-events-none z-10" />
                <Input
                  aria-label="Correo electronico"
                  placeholder="correo@rankeao.cl"
                  type="email"
                  className="w-full h-12 pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="relative w-full">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/40 pointer-events-none z-10" />
                <Input
                  aria-label="Contrasena"
                  placeholder="Contraseña"
                  type={isVisible ? "text" : "password"}
                  className="w-full h-12 pl-10 pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  aria-label={isVisible ? "Ocultar contrasena" : "Mostrar contrasena"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors z-10 cursor-pointer"
                  onClick={() => setIsVisible(!isVisible)}
                >
                  {isVisible ? <Eye className="size-4" /> : <EyeSlash className="size-4" />}
                </button>
              </div>

              <div className="flex justify-end w-full">
                <Link href="/forgot-password" className="text-xs text-white/50 hover:text-white hover:underline font-medium transition-colors">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              {error && (
                <div role="alert" className="w-full px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-sm text-red-500">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 font-semibold rounded-xl bg-[var(--accent)] text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-shadow"
                isDisabled={isSubmitting}
              >
                {isSubmitting ? "Entrando..." : "Iniciar sesión"}
              </Button>
            </form>

            {/* OAuth divider */}
            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-[var(--bg-solid,transparent)] text-white/50">o continúa con</span>
              </div>
            </div>

            {oauthErrorMessage && (
              <div role="alert" className="w-full px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-sm text-red-500">{oauthErrorMessage}</p>
              </div>
            )}

            <a
              href={`${API_ORIGIN}/api/v1/auth/oauth/discord/start?returnTo=/`}
              className="flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-[#5865F2] hover:bg-[#4752c4] text-white font-semibold transition-colors"
            >
              <IconDiscord size={20} />
              Continuar con Discord
            </a>
          </div>

          {/* Footer */}
          <div className="space-y-3 text-center">
            <p className="text-sm text-white/50">
              ¿No tienes cuenta?{" "}
              <Link href="/register" className="text-[var(--accent)] hover:underline font-semibold">
                Registrate gratis
              </Link>
            </p>
            <Link href="/" className="block text-xs text-white/40 hover:text-white/70 transition-colors">
              Continuar sin cuenta
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
