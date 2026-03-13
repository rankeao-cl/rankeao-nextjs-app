"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import NavbarSearch from "./NavbarSearch";

import { Avatar, Button, Badge, Popover, ScrollShadow } from "@heroui/react";
import { useAuth } from "@/context/AuthContext";
import {
  ArrowRightFromSquare,
  Person,
  Bell,
  Magnifier,
  ShoppingCart,
  StarFill,
  Plus,
  Xmark,
  SquareDashed,
  Sun,
  Moon,
  Cup,
  Gear,
  Pencil,
  Comment,
} from "@gravity-ui/icons";
import { useTheme } from "next-themes";
import { getNotifications, getUnreadNotificationCount, markAllNotificationsRead } from "@/lib/api/notifications";

type AppNotification = {
  id: string;
  type: "social" | "marketplace" | "tournament" | "system";
  message?: string;
  data?: any;
  created_at: string;
  is_read?: boolean;
};

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { session, status, logout } = useAuth();
  const isAuthenticated = status === "authenticated" && Boolean(session?.email);

  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  useEffect(() => {
    if (status === "authenticated" && session?.accessToken) {
      Promise.all([
        getNotifications({ limit: 10 }, session.accessToken).catch(() => null),
        getUnreadNotificationCount(session.accessToken).catch(() => null),
      ]).then(([notifRes, countRes]) => {
        if (notifRes && Array.isArray(notifRes.notifications)) {
          setNotifications(notifRes.notifications);
        } else if (Array.isArray(notifRes)) {
          setNotifications(notifRes);
        }

        if (countRes?.count !== undefined) {
          setUnreadCount(countRes.count);
        }
      });
    }
  }, [status, session]);

  const handleMarkAllRead = async () => {
    try {
      if (session?.accessToken) {
        await markAllNotificationsRead(session.accessToken);
        setUnreadCount(0);
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      }
    } catch {
      // ignore
    }
  };

  return (
    <header
      className="sticky top-0 z-50 border-b backdrop-blur-2xl h-16"
      style={{
        borderColor: "var(--border)",
        background: "oklch(from var(--background) l c h / 0.8)",
      }}
    >
      <div className="rk-container h-full flex items-center justify-between gap-4">
        {/* Mobile Expanded Search */}
        {isSearchExpanded ? (
          <div className="flex-1 flex items-center gap-2 animate-appearance-in">
            <NavbarSearch expanded onClose={() => setIsSearchExpanded(false)} />
            <Button
              isIconOnly
              variant="tertiary"
              size="sm"
              className="text-[var(--foreground)]"
              onPress={() => setIsSearchExpanded(false)}
              aria-label="Cerrar búsqueda"
            >
              <Xmark className="size-5" />
            </Button>
          </div>
        ) : (
          <>
            {/* Logo */}
            <Link href="/" className="flex items-center shrink-0">
              <span
                className="text-xl font-extrabold uppercase tracking-wide"
                style={{
                  background: "linear-gradient(135deg, var(--accent) 0%, var(--brand) 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Rankeao
              </span>
            </Link>

            {/* Search bar — desktop */}
            <div className="hidden md:flex flex-1 max-w-md">
              <NavbarSearch />
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              {/* Mobile actions bar */}
              <div className="flex md:hidden items-center gap-1 flex-1 justify-end">
                {/* Botón + para crear post (mobile) */}
                {isAuthenticated && (
                  <Link href="/feed/new" className="flex items-center">
                    <Button
                      isIconOnly
                      variant="primary"
                      size="sm"
                      className="text-white bg-[var(--accent)] hover:bg-[var(--accent)]/90 shadow-brand-sm"
                      aria-label="Crear post"
                    >
                      <Plus className="size-4 font-bold" />
                    </Button>
                  </Link>
                )}

                {/* Search icon (mobile) */}
                <Button
                  isIconOnly
                  variant="tertiary"
                  size="sm"
                  className="text-[var(--muted)]"
                  onPress={() => setIsSearchExpanded(true)}
                  aria-label="Abrir búsqueda"
                >
                  <Magnifier className="size-4" />
                </Button>

                {/* Chat bubble (mobile) */}
                {isAuthenticated && (
                  <Button
                    isIconOnly
                    variant="tertiary"
                    size="sm"
                    className="text-[var(--muted)]"
                    onPress={() => router.push("/chat")}
                    aria-label="Chat"
                  >
                    <Comment className="size-5" />
                  </Button>
                )}

                {/* Theme toggle (mobile) */}
                <Button
                  isIconOnly
                  variant="tertiary"
                  size="sm"
                  className="text-[var(--muted)]"
                  onPress={() => setTheme(isDark ? "light" : "dark")}
                  aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
                >
                  {mounted && (isDark ? <Sun className="size-4" /> : <Moon className="size-4" />)}
                </Button>
              </div>

              {/* Desktop actions (md+) */}
              <div className="hidden md:flex items-center gap-2">
                {/* Theme toggle */}
                <Button
                  isIconOnly
                  variant="tertiary"
                  size="sm"
                  className="text-[var(--muted)]"
                  onPress={() => setTheme(isDark ? "light" : "dark")}
                  aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
                >
                  {mounted && (isDark ? <Sun className="size-4" /> : <Moon className="size-4" />)}
                </Button>

                {isAuthenticated ? (
                  <>
                    {/* Notifications */}
                    <Popover>
                      <Popover.Trigger
                        className="relative flex items-center justify-center p-0 min-w-8 min-h-8 text-[var(--muted)] cursor-pointer hover:bg-[var(--default)] rounded-lg transition-colors"
                      >
                        <Badge.Anchor>
                          <Bell className="size-[18px]" />
                          {unreadCount > 0 && (
                            <Badge color="danger" size="sm" className="absolute -top-1.5 -right-1.5 z-10 scale-80 border-2 border-[var(--background)]">
                              {unreadCount > 9 ? "+9" : unreadCount}
                            </Badge>
                          )}
                        </Badge.Anchor>
                      </Popover.Trigger>
                      <Popover.Content className="w-[340px] p-0 overflow-hidden bg-[var(--surface)] border border-[var(--border)] shadow-xl rounded-xl">
                        <div className="flex flex-col w-full">
                          {/* Header with gradient bar */}
                          <div className="relative">
                            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[var(--accent)] to-[var(--brand)]" />
                            <div className="px-4 py-3 pt-4 flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-sm text-[var(--foreground)]">Notificaciones</h3>
                                {unreadCount > 0 && (
                                  <span className="text-[10px] font-bold bg-[var(--accent)]/15 text-[var(--accent)] px-1.5 py-0.5 rounded-full">{unreadCount} nuevas</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {notifications.length > 0 && (
                                  <button onClick={handleMarkAllRead} className="text-[10px] text-[var(--accent)] hover:underline font-bold cursor-pointer">Marcar leídas</button>
                                )}
                                <Link href="/config" className="text-[10px] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors font-semibold">⚙️</Link>
                              </div>
                            </div>
                          </div>

                          <div className="border-t border-[var(--border)]">
                            <ScrollShadow className="max-h-[360px] w-full custom-scrollbar">
                              <div className="flex flex-col">
                                {notifications.length === 0 ? (
                                  <div className="py-10 px-6 text-center">
                                    <div className="w-14 h-14 rounded-2xl bg-[var(--accent)]/10 flex items-center justify-center mx-auto mb-3">
                                      <Bell className="size-6 text-[var(--accent)] opacity-60" />
                                    </div>
                                    <p className="text-sm font-semibold text-[var(--foreground)] mb-1">Todo al día</p>
                                    <p className="text-xs text-[var(--muted)]">No tienes notificaciones pendientes</p>
                                  </div>
                                ) : (
                                  notifications.map((notif) => (
                                    <div key={notif.id} className={`flex gap-3 px-3 py-3 mx-1.5 my-0.5 rounded-lg hover:bg-[var(--surface-secondary)] transition-colors cursor-pointer relative ${!notif.is_read ? "bg-[var(--accent)]/5" : ""}`}>
                                      {/* Unread dot indicator */}
                                      {!notif.is_read && (
                                        <div className="absolute top-3 left-1 w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                                      )}
                                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${notif.type === "social" ? "bg-blue-500/15 text-blue-500" : notif.type === "marketplace" ? "bg-orange-500/15 text-orange-500" : notif.type === "tournament" ? "bg-purple-500/15 text-purple-500" : "bg-[var(--default)] text-[var(--muted)]"}`}>
                                        {notif.type === "social" && <Person className="size-4" />}
                                        {notif.type === "marketplace" && <ShoppingCart className="size-4" />}
                                        {notif.type === "tournament" && <StarFill className="size-4" />}
                                        {notif.type === "system" && <Bell className="size-4" />}
                                      </div>
                                      <div className="flex flex-col flex-1 leading-snug min-w-0">
                                        <p className={`text-[13px] text-[var(--foreground)] leading-relaxed ${!notif.is_read ? "font-semibold" : ""}`} dangerouslySetInnerHTML={{ __html: notif.message || "Nueva notificación" }} />
                                        <p className="text-[10px] text-[var(--muted)] mt-1 font-medium">hace instantes</p>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            </ScrollShadow>
                          </div>

                          {/* Footer */}
                          {notifications.length > 0 && (
                            <div className="p-2 border-t border-[var(--border)]">
                              <Link href="/notificaciones" className="flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-semibold text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-colors">
                                Ver todas las notificaciones →
                              </Link>
                            </div>
                          )}
                        </div>
                      </Popover.Content>
                    </Popover>

                    {/* Create Menu */}
                    <Popover>
                      <Popover.Trigger
                        className="flex items-center justify-center min-w-8 min-h-8 rounded-full shadow-brand-sm bg-[var(--accent)] text-[var(--accent-foreground)] cursor-pointer hover:scale-105 active:scale-95 transition-transform"
                        aria-label="Crear"
                      >
                        <Plus className="size-4 font-bold" />
                      </Popover.Trigger>
                      <Popover.Content className="w-[260px] p-0 overflow-hidden bg-[var(--surface)] border border-[var(--border)] shadow-xl rounded-xl">
                        <div className="px-3.5 py-2.5 border-b border-[var(--border)] bg-[var(--surface-secondary)]">
                          <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Crear nuevo</p>
                        </div>
                        <div className="p-1.5 flex flex-col gap-0.5">
                          <Link href="/feed/new" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[var(--surface-secondary)] transition-colors group cursor-pointer">
                            <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center shrink-0 group-hover:bg-blue-500/25 transition-colors">
                              <Pencil className="size-4 text-blue-500" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-[var(--foreground)]">Crear Post</p>
                              <p className="text-[10px] text-[var(--muted)] leading-tight">Comparte con la comunidad</p>
                            </div>
                          </Link>
                          <Link href="/decks/new" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[var(--surface-secondary)] transition-colors group cursor-pointer">
                            <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center shrink-0 group-hover:bg-purple-500/25 transition-colors">
                              <SquareDashed className="size-4 text-purple-500" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-[var(--foreground)]">Publicar Mazo</p>
                              <p className="text-[10px] text-[var(--muted)] leading-tight">Muestra tu mejor deck</p>
                            </div>
                          </Link>
                          <Link href="/marketplace/new" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[var(--surface-secondary)] transition-colors group cursor-pointer">
                            <div className="w-8 h-8 rounded-lg bg-orange-500/15 flex items-center justify-center shrink-0 group-hover:bg-orange-500/25 transition-colors">
                              <ShoppingCart className="size-4 text-orange-500" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-[var(--foreground)]">Vender Carta</p>
                              <p className="text-[10px] text-[var(--muted)] leading-tight">Listado en el marketplace</p>
                            </div>
                          </Link>
                          <Link href="/torneos/new" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[var(--surface-secondary)] transition-colors group cursor-pointer">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0 group-hover:bg-emerald-500/25 transition-colors">
                              <Cup className="size-4 text-emerald-500" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-[var(--foreground)]">Crear Torneo</p>
                              <p className="text-[10px] text-[var(--muted)] leading-tight">Organiza un evento competitivo</p>
                            </div>
                          </Link>
                        </div>
                      </Popover.Content>
                    </Popover>

                    {/* Avatar dropdown */}
                    <div className="ml-1">
                      <Popover>
                        <Popover.Trigger className="rounded-full cursor-pointer flex border-2 border-transparent hover:border-[var(--accent)]/40 transition-colors outline-none">
                          <Avatar size="sm">
                            <Avatar.Image
                              alt="Avatar"
                              src="https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/blue.jpg"
                            />
                            <Avatar.Fallback delayMs={600}>
                              {session?.username?.[0]?.toUpperCase() || "U"}
                            </Avatar.Fallback>
                          </Avatar>
                        </Popover.Trigger>
                        <Popover.Content className="w-[260px] p-0 overflow-hidden bg-[var(--surface)] border border-[var(--border)] shadow-xl rounded-xl">
                          {/* User Info Header */}
                          <div className="relative">
                            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[var(--accent)] to-[var(--brand)]" />
                            <div className="flex items-center gap-3 px-4 py-4 pt-5">
                              <Avatar size="sm" className="ring-2 ring-[var(--accent)]/30">
                                <Avatar.Image
                                  alt="Avatar"
                                  src="https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/blue.jpg"
                                />
                                <Avatar.Fallback delayMs={600}>
                                  {session?.username?.[0]?.toUpperCase() || "U"}
                                </Avatar.Fallback>
                              </Avatar>
                              <div className="flex flex-col min-w-0">
                                <p className="text-sm font-bold text-[var(--foreground)] truncate">{session?.username}</p>
                                <p className="text-[11px] text-[var(--muted)] truncate">{session?.email}</p>
                              </div>
                            </div>
                          </div>

                          {/* Menu Sections */}
                          <div className="border-t border-[var(--border)]">
                            <div className="p-1.5">
                              <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">Mi cuenta</p>
                              <Link href="/perfil/me" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--surface-secondary)] transition-colors cursor-pointer">
                                <Person className="size-4 text-[var(--muted)]" />
                                <span className="text-sm text-[var(--foreground)]">Mi Perfil</span>
                              </Link>
                              <Link href="/config" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--surface-secondary)] transition-colors cursor-pointer">
                                <Gear className="size-4 text-[var(--muted)]" />
                                <span className="text-sm text-[var(--foreground)]">Configuración</span>
                              </Link>
                            </div>

                            <div className="border-t border-[var(--border)] p-1.5">
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
                        variant="secondary"
                        size="sm"
                      >
                        Login
                      </Button>
                    </Link>
                    <Link href="/register" prefetch={false} className="hidden sm:block">
                      <Button
                        variant="primary"
                        size="sm"
                        className="font-bold"
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
    </header>
  );
}
