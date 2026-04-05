"use client";

import { type FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Person, Envelope, Lock, Eye, EyeSlash } from "@gravity-ui/icons";
import { Button } from "@heroui/react/button";
import { Form } from "@heroui/react/form";
import { Input } from "@heroui/react/input";

import { useAuth } from "@/lib/hooks/use-auth";
import { RankeaoLogo } from "@/components/icons/RankeaoLogo";
import { useTheme } from "next-themes";

export default function RegisterForm() {
  const router = useRouter();
  const { register, status } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
    if (!username.trim() || !email.trim() || !password.trim()) {
      setError("Completa todos los campos.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    try {
      setIsSubmitting(true);
      await register({ username: username.trim(), email: email.trim(), password });
      router.replace("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo completar el registro.");
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
          <p className="text-sm text-[var(--muted)]">Crea tu cuenta de jugador</p>
        </div>

        {/* Card */}
        <div className="glass p-6 sm:p-8 space-y-6">
          <Form className="space-y-4" onSubmit={handleSubmit}>
            <div className="relative w-full">
              <Person className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[var(--muted)] pointer-events-none z-10" />
              <Input
                aria-label="Nombre de usuario"
                placeholder="Nombre de usuario"
                className="w-full h-12 pl-10"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="relative w-full">
              <Envelope className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[var(--muted)] pointer-events-none z-10" />
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
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[var(--muted)] pointer-events-none z-10" />
              <Input
                aria-label="Contrasena"
                placeholder="Contraseña"
                type={showPassword ? "text" : "password"}
                className="w-full h-12 pl-10 pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                aria-label={showPassword ? "Ocultar contrasena" : "Mostrar contrasena"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors z-10 cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <Eye className="size-4" /> : <EyeSlash className="size-4" />}
              </button>
            </div>

            <div className="relative w-full">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[var(--muted)] pointer-events-none z-10" />
              <Input
                aria-label="Confirmar contrasena"
                placeholder="Confirmar contraseña"
                type={showPassword ? "text" : "password"}
                className="w-full h-12 pl-10"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div role="alert" className="w-full px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-sm text-red-500">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 font-semibold rounded-xl bg-[var(--accent)] text-[var(--accent-foreground)]"
              isDisabled={isSubmitting}
            >
              {isSubmitting ? "Creando cuenta..." : "Crear cuenta"}
            </Button>
          </Form>

          <p className="text-center text-[11px] text-[var(--muted)] leading-relaxed">
            Al registrarte aceptas los{" "}
            <Link href="/terminos" className="underline">términos de servicio</Link>{" "}
            y la{" "}
            <Link href="/privacidad" className="underline">política de privacidad</Link>.
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-[var(--muted)]">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-[var(--accent)] hover:underline font-semibold">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
