"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { RankeaoLogo } from "./icons/RankeaoLogo";
import NavbarSearch from "./NavbarSearch";

import { Avatar, Button, Popover } from "@heroui/react";
import { useAuth } from "@/context/AuthContext";
import { useCreatePostModal } from "@/context/CreatePostModalContext";
import {
  ArrowRightFromSquare,
  Person,
  Bell,
  Magnifier,
  ShoppingCart,
  Plus,
  Xmark,
  SquareDashed,
  Sun,
  Moon,
  Cup,
  Gear,
  Pencil,
} from "@gravity-ui/icons";
import { useTheme } from "next-themes";
import { getUnreadNotificationCount } from "@/lib/api/notifications";
import { getUserProfile } from "@/lib/api/social";
import NotificationSidebar from "./NotificationSidebar";

const authPages = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email"];

export default function Navbar() {
  const pathname = usePathname();
  const { session, status, logout } = useAuth();
  const { openCreatePost } = useCreatePostModal();
  const isAuthenticated = status === "authenticated" && Boolean(session?.email);

  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";

  const [unreadCount, setUnreadCount] = useState(0);
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);
  const [notifSidebarOpen, setNotifSidebarOpen] = useState(false);

  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  useEffect(() => {
    if (status !== "authenticated" || !session?.accessToken) return;

    const token = session.accessToken;

    const pollCount = () => {
      getUnreadNotificationCount(token).catch(() => null).then((countRes) => {
        const total = countRes?.total;
        if (typeof total === "number") setUnreadCount(total);
      });
    };

    pollCount();
    const interval = setInterval(pollCount, 30_000);

    // Fetch user avatar once
    if (session.username) {
      getUserProfile(session.username).then((res: any) => {
        const profile = res?.data ?? res;
        if (profile?.avatar_url) setUserAvatarUrl(profile.avatar_url);
      }).catch(() => {});
    }

    return () => clearInterval(interval);
  }, [status, session]);

  if (authPages.some((p) => pathname.startsWith(p))) {
    return null;
  }


  return (
    <header
      className="sticky top-0 z-50 h-16"
      style={{
        borderBottom: "1px solid var(--border)",
        background: "var(--background)",
      }}
    >
      <div className="w-full h-full px-4 flex items-center justify-between relative">
        {/* ── Mobile: Expanded Search ── */}
        {isSearchExpanded ? (
          <div className="flex-1 flex items-center gap-2 md:hidden">
            <NavbarSearch expanded onClose={() => setIsSearchExpanded(false)} />
            <button
              onClick={() => setIsSearchExpanded(false)}
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 cursor-pointer"
              style={{ background: "var(--surface-solid)" }}
              aria-label="Cerrar búsqueda"
            >
              <Xmark className="size-4" style={{ color: "var(--muted)" }} />
            </button>
          </div>
        ) : (
          <>
            {/* Left side: Logo */}
            <div className="flex items-center z-10">
              <Link href="/" className="flex items-center shrink-0">
                <RankeaoLogo
                  className="h-7 w-auto transition-colors text-foreground"
                />
              </Link>
            </div>

            {/* Center: Search bar — desktop only */}
            <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm lg:max-w-md pointer-events-none justify-center">
              <div className="w-full pointer-events-auto">
                <NavbarSearch />
              </div>
            </div>

            {/* Right side: Actions */}
            <div className="flex items-center gap-2 z-10">
              {/* ── Mobile actions (AppTopBar style) ── */}
              <div className="flex md:hidden items-center gap-1">
                {/* Search */}
                <button
                  onClick={() => setIsSearchExpanded(true)}
                  className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer"
                  style={{ background: "var(--surface-solid)" }}
                  aria-label="Buscar"
                >
                  <Magnifier className="size-4" style={{ color: "var(--muted)" }} />
                </button>

                {/* Bell */}
                {isAuthenticated && (
                  <Link
                    href="/notificaciones"
                    className="relative w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ background: "var(--surface-solid)" }}
                    aria-label="Notificaciones"
                  >
                    <Bell className="size-4" style={{ color: "var(--muted)" }} />
                    {unreadCount > 0 && (
                      <span
                        className="absolute flex items-center justify-center rounded-full text-white font-extrabold leading-none px-1"
                        style={{
                          top: "4px",
                          right: "2px",
                          minWidth: "18px",
                          height: "18px",
                          fontSize: "10px",
                          background: "var(--danger)",
                          border: "2px solid var(--background)",
                        }}
                      >
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </Link>
                )}

                {/* Create */}
                {isAuthenticated && (
                  <button
                    onClick={openCreatePost}
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ background: "#3B82F6", border: "none", cursor: "pointer" }}
                    aria-label="Crear"
                  >
                    <Plus className="size-4 text-white" />
                  </button>
                )}
              </div>

              {/* Desktop actions (md+) */}
              <div className="hidden md:flex items-center gap-2">
                {/* Theme toggle */}
                <Button
                  isIconOnly
                  variant="tertiary"
                  size="sm"
                  className="text-muted"
                  onPress={() => setTheme(isDark ? "light" : "dark")}
                  aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
                >
                  {mounted && (isDark ? <Sun className="size-4" /> : <Moon className="size-4" />)}
                </Button>

                {isAuthenticated ? (
                  <>
                    {/* Notifications — opens sidebar */}
                    <button
                      onClick={() => setNotifSidebarOpen(true)}
                      className="relative flex items-center justify-center p-0 min-w-8 min-h-8 text-muted cursor-pointer hover:bg-black/5 rounded-lg transition-colors"
                      aria-label="Notificaciones"
                    >
                      <Bell className="size-[18px]" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-danger text-white text-[10px] font-bold leading-none px-1 border-2 border-background">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </button>

                    {/* Create Menu */}
                    <Popover>
                      <Popover.Trigger
                        className="flex items-center justify-center min-w-8 min-h-8 rounded-full shadow-brand-sm bg-accent text-white cursor-pointer hover:scale-105 active:scale-95 transition-transform"
                        aria-label="Crear"
                      >
                        <Plus className="size-4 font-bold" />
                      </Popover.Trigger>
                      <Popover.Content className="w-[260px] max-w-[calc(100vw-2rem)] p-0 overflow-hidden glass-sm shadow-xl !rounded-[22px]">
                        <div className="px-3.5 py-2.5 border-b border-border bg-surface-solid">
                          <p className="text-xs font-bold uppercase tracking-wider text-muted">Crear nuevo</p>
                        </div>
                        <div className="p-1.5 flex flex-col gap-0.5">
                          <button onClick={openCreatePost} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-solid transition-colors group cursor-pointer w-full text-left" style={{ background: "none", border: "none" }}>
                            <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center shrink-0 group-hover:bg-blue-500/25 transition-colors">
                              <Pencil className="size-4 text-blue-500" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-foreground">Crear Post</p>
                              <p className="text-[11px] text-muted leading-tight">Comparte con la comunidad</p>
                            </div>
                          </button>
                          <Link href="/decks/new" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-solid transition-colors group cursor-pointer">
                            <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center shrink-0 group-hover:bg-purple-500/25 transition-colors">
                              <SquareDashed className="size-4 text-purple-500" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-foreground">Publicar Mazo</p>
                              <p className="text-[11px] text-muted leading-tight">Muestra tu mejor deck</p>
                            </div>
                          </Link>
                          <Link href="/marketplace/new" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-solid transition-colors group cursor-pointer">
                            <div className="w-8 h-8 rounded-lg bg-orange-500/15 flex items-center justify-center shrink-0 group-hover:bg-orange-500/25 transition-colors">
                              <ShoppingCart className="size-4 text-orange-500" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-foreground">Vender Carta</p>
                              <p className="text-[11px] text-muted leading-tight">Listado en el marketplace</p>
                            </div>
                          </Link>
                          <Link href="/torneos/new" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-solid transition-colors group cursor-pointer">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0 group-hover:bg-emerald-500/25 transition-colors">
                              <Cup className="size-4 text-emerald-500" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-foreground">Crear Torneo</p>
                              <p className="text-[11px] text-muted leading-tight">Organiza un evento competitivo</p>
                            </div>
                          </Link>
                        </div>
                      </Popover.Content>
                    </Popover>

                    {/* Avatar dropdown */}
                    <div className="ml-1">
                      <Popover>
                        <Popover.Trigger className="rounded-full cursor-pointer flex border-2 border-transparent hover:border-accent/40 transition-colors outline-none">
                          <Avatar size="sm">
                            <Avatar.Image
                              alt="Avatar"
                              src={userAvatarUrl || undefined}
                            />
                            <Avatar.Fallback delayMs={600}>
                              {session?.username?.[0]?.toUpperCase() || "U"}
                            </Avatar.Fallback>
                          </Avatar>
                        </Popover.Trigger>
                        <Popover.Content className="w-[260px] max-w-[calc(100vw-2rem)] p-0 overflow-hidden glass-sm shadow-xl !rounded-[22px]">
                          {/* User Info Header */}
                          <div className="relative">
                            <div className="absolute top-0 inset-x-0 h-0.5 bg-accent" />
                            <div className="flex items-center gap-3 px-4 py-4 pt-5">
                              <Avatar size="sm" className="ring-2 ring-accent/30">
                                <Avatar.Image
                                  alt="Avatar"
                                  src={userAvatarUrl || undefined}
                                />
                                <Avatar.Fallback delayMs={600}>
                                  {session?.username?.[0]?.toUpperCase() || "U"}
                                </Avatar.Fallback>
                              </Avatar>
                              <div className="flex flex-col min-w-0">
                                <p className="text-sm font-bold text-foreground truncate">{session?.username}</p>
                                <p className="text-[11px] text-muted truncate">{session?.email}</p>
                              </div>
                            </div>
                          </div>

                          {/* Menu Sections */}
                          <div className="border-t border-border">
                            <div className="p-1.5">
                              <p className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-muted">Mi cuenta</p>
                              <Link href="/perfil/me" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-solid transition-colors cursor-pointer">
                                <Person className="size-4 text-muted" />
                                <span className="text-sm text-foreground">Mi Perfil</span>
                              </Link>
                              <Link href="/config" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-solid transition-colors cursor-pointer">
                                <Gear className="size-4 text-muted" />
                                <span className="text-sm text-foreground">Configuración</span>
                              </Link>
                            </div>

                            <div className="border-t border-border p-1.5">
                              <button
                                onClick={() => logout()}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer text-left"
                              >
                                <ArrowRightFromSquare className="size-4 text-red-500" />
                                <span className="text-sm text-red-500 font-medium">Cerrar Sesión</span>
                              </button>
                            </div>
                          </div>
                        </Popover.Content>
                      </Popover>
                    </div>
                  </>
                ) : (
                  <>
                    <Link href="/login" prefetch={false}>
                      <Button
                        variant="ghost"
                        size="md"
                        className="font-bold px-5 h-9 min-w-0"
                      >
                        Iniciar sesión
                      </Button>
                    </Link>
                    <Link href="/register" prefetch={false} className="hidden sm:block">
                      <Button
                        variant="primary"
                        size="md"
                        className="font-bold px-5 h-9 rounded-full bg-accent text-white shadow-none"
                      >
                        Regístrate
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Notification sidebar — desktop only (mobile uses /notificaciones page) */}
      <div className="hidden md:block">
        <NotificationSidebar
          isOpen={notifSidebarOpen}
          onClose={() => setNotifSidebarOpen(false)}
          accessToken={session?.accessToken}
          onUnreadCountChange={setUnreadCount}
        />
      </div>
    </header>
  );
}
