"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Button } from "@heroui/react";
import { useAuth } from "@/context/AuthContext";

const navLinks = [
  { href: "/", label: "Inicio" },
  { href: "/torneos", label: "Torneos" },
  { href: "/ranking", label: "Ranking" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/juegos", label: "Juegos" },
  { href: "/comunidades", label: "Comunidades" },
];

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const { session, status, logout } = useAuth();
  const isAuthenticated = status === "authenticated" && Boolean(session?.email);

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-500/25 bg-black/75 backdrop-blur-2xl">
      <div className="rk-container h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg overflow-hidden border border-zinc-500/40 shadow-[0_0_18px_rgba(248,250,252,0.4)] bg-black/40">
            <Image
              src="/logo.png"
              alt="Rankeao logo"
              width={32}
              height={32}
              className="w-full h-full object-cover"
              priority
            />
          </div>
          <div className="leading-none">
            <p className="text-white font-bold tracking-wide text-lg">Rankeao</p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-200">Chile TCG</p>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1.5">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all ${pathname === link.href
                  ? "bg-zinc-500/20 text-white border border-zinc-300/45 shadow-[0_0_14px_rgba(248,250,252,0.35)]"
                  : "text-gray-300 hover:text-zinc-200 hover:bg-zinc-300/10 border border-transparent"
                }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2.5">
          {isAuthenticated ? (
            <>
              <p className="max-w-[220px] truncate rounded-full border border-zinc-300/30 bg-zinc-300/10 px-3 py-1 text-xs font-semibold text-zinc-100">
                {session?.email}
              </p>
              <Link href="/perfil" prefetch={false}>
                <Button
                  size="sm"
                  className="bg-transparent text-white border border-rankeao-neon-cyan/50 hover:border-rankeao-neon-cyan hover:bg-rankeao-neon-cyan/10"
                >
                  Mi Perfil
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-100 border border-white/15"
                onPress={logout}
              >
                Salir
              </Button>
            </>
          ) : (
            <>
              <Link href="/login" prefetch={false}>
                <Button variant="ghost" size="sm" className="text-gray-100 border border-white/15">
                  Login
                </Button>
              </Link>
              <Link href="/register" prefetch={false}>
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-zinc-700 to-zinc-400 text-white font-bold neon-button"
                >
                  Registrate
                </Button>
              </Link>
            </>
          )}
        </div>

        <Button
          aria-label={isMenuOpen ? "Cerrar menu" : "Abrir menu"}
          onPress={() => setIsMenuOpen((prev) => !prev)}
          className="md:hidden min-w-0 w-9 h-9 rounded-lg border border-zinc-700/60 text-gray-200"
          isIconOnly
          variant="ghost"
        >
          {isMenuOpen ? "✕" : "☰"}
        </Button>
      </div>

      {isMenuOpen && (
        <div className="md:hidden px-4 pb-4 border-t border-zinc-700/30 bg-black/95">
          <nav className="flex flex-col gap-2 py-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`py-2 px-3 rounded-lg text-sm font-semibold ${pathname === link.href
                    ? "bg-zinc-500/20 text-white border border-zinc-500/40"
                    : "text-gray-300 hover:bg-white/5"
                  }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {isAuthenticated ? (
              <div className="space-y-2 pt-1">
                <p className="rounded-lg border border-zinc-300/30 bg-zinc-300/10 px-3 py-2 text-sm font-semibold text-zinc-100 break-all">
                  {session?.email}
                </p>
                <Link href="/perfil" onClick={() => setIsMenuOpen(false)}>
                  <Button
                    className="w-full bg-transparent border border-rankeao-neon-cyan/50 text-white hover:border-rankeao-neon-cyan hover:bg-rankeao-neon-cyan/10"
                    size="sm"
                  >
                    Mi Perfil
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  className="w-full border border-white/15 text-gray-200"
                  size="sm"
                  onPress={() => {
                    logout();
                    setIsMenuOpen(false);
                  }}
                >
                  Salir
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="ghost" className="w-full border border-white/15 text-gray-200" size="sm">
                    Login
                  </Button>
                </Link>
                <Link href="/register" onClick={() => setIsMenuOpen(false)}>
                  <Button className="w-full bg-gradient-to-r from-zinc-700 to-zinc-400 text-white" size="sm">
                    Registrate
                  </Button>
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
