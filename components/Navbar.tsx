"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { RankeaoLogo } from "./icons/RankeaoLogo";
import NavbarSearch from "./NavbarSearch";

import { Avatar, Button, Popover, ScrollShadow } from "@heroui/react";
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
import { getUserProfile } from "@/lib/api/social";
import type { Notification } from "@/lib/types/notification";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "hace instantes";
  if (mins < 60) return `hace ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `hace ${days}d`;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}

function getNotifCategory(notif: Notification): string {
  return notif.category || notif.type || "system";
}

const authPages = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email"];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { session, status, logout } = useAuth();
  const isAuthenticated = status === "authenticated" && Boolean(session?.email);

  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);

  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  useEffect(() => {
    if (status === "authenticated" && session?.accessToken) {
      Promise.all([
        getNotifications({ per_page: 10 }, session.accessToken).catch(() => null),
        getUnreadNotificationCount(session.accessToken).catch(() => null),
      ]).then(([notifRes, countRes]) => {
        const raw = notifRes?.notifications ?? [];
        if (Array.isArray(raw)) {
          setNotifications(raw);
        }

        const total = countRes?.total;
        if (typeof total === "number") {
          setUnreadCount(total);
        }
      });

      // Fetch user avatar
      if (session.username) {
        getUserProfile(session.username).then((res: any) => {
          const profile = res?.data ?? res;
          if (profile?.avatar_url) setUserAvatarUrl(profile.avatar_url);
        }).catch(() => {});
      }
    }
  }, [status, session]);

  if (authPages.some((p) => pathname.startsWith(p))) {
    return null;
  }

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
      className="sticky top-0 z-50 h-16"
      style={{
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "#000000",
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
              style={{ background: "#1A1A1E" }}
              aria-label="Cerrar búsqueda"
            >
              <Xmark className="size-4" style={{ color: "#888891" }} />
            </button>
          </div>
        ) : (
          <>
            {/* Left side: Logo */}
            <div className="flex items-center z-10">
              <Link href="/" className="flex items-center shrink-0">
                <RankeaoLogo
                  className={`h-7 w-auto transition-colors ${isDark ? "text-white" : "text-zinc-700"}`}
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
                  style={{ background: "#1A1A1E" }}
                  aria-label="Buscar"
                >
                  <Magnifier className="size-4" style={{ color: "#888891" }} />
                </button>

                {/* Bell */}
                {isAuthenticated && (
                  <Link
                    href="/notificaciones"
                    className="relative w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ background: "#1A1A1E" }}
                    aria-label="Notificaciones"
                  >
                    <Bell className="size-4" style={{ color: "#888891" }} />
                    {unreadCount > 0 && (
                      <span
                        className="absolute flex items-center justify-center rounded-full text-white font-extrabold leading-none px-1"
                        style={{
                          top: "4px",
                          right: "2px",
                          minWidth: "18px",
                          height: "18px",
                          fontSize: "10px",
                          background: "#ED4245",
                          border: "2px solid #000000",
                        }}
                      >
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </Link>
                )}

                {/* Create */}
                {isAuthenticated && (
                  <Link
                    href="/feed/new"
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ background: "#3B82F6" }}
                    aria-label="Crear"
                  >
                    <Plus className="size-4 text-white" />
                  </Link>
                )}
              </div>

              {/* Desktop actions (md+) */}
              <div className="hidden md:flex items-center gap-2">
                {/* Theme toggle */}
                <Button
                  isIconOnly
                  variant="tertiary"
                  size="sm"
                  className="text-[#888891]"
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
                        className="relative flex items-center justify-center p-0 min-w-8 min-h-8 text-[#888891] cursor-pointer hover:bg-[rgba(255,255,255,0.08)] rounded-lg transition-colors"
                      >
                        <Bell className="size-[18px]" />
                        {unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none px-1 border-2 border-[#000000]">
                            {unreadCount > 9 ? "9+" : unreadCount}
                          </span>
                        )}
                      </Popover.Trigger>
                      <Popover.Content className="w-[340px] max-w-[calc(100vw-2rem)] p-0 overflow-hidden glass-sm shadow-xl !rounded-[22px]">
                        <div className="flex flex-col w-full">
                          {/* Header with gradient bar */}
                          <div className="relative">
                            <div className="absolute top-0 inset-x-0 h-0.5 bg-[#3B82F6]" />
                            <div className="px-4 py-3 pt-4 flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-sm text-[#F2F2F2]">Notificaciones</h3>
                                {unreadCount > 0 && (
                                  <span className="text-[11px] font-bold bg-[#3B82F6]/15 text-[#3B82F6] px-1.5 py-0.5 rounded-full">{unreadCount} nuevas</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {notifications.length > 0 && (
                                  <button onClick={handleMarkAllRead} className="text-[11px] text-[#3B82F6] hover:underline font-bold cursor-pointer">Marcar leídas</button>
                                )}
                                <Link href="/config" className="text-[11px] text-[#888891] hover:text-[#F2F2F2] transition-colors font-semibold">⚙️</Link>
                              </div>
                            </div>
                          </div>

                          <div className="border-t border-[rgba(255,255,255,0.06)]">
                            <ScrollShadow className="max-h-[360px] w-full custom-scrollbar">
                              <div className="flex flex-col">
                                {notifications.length === 0 ? (
                                  <div className="py-10 px-6 text-center">
                                    <div className="w-14 h-14 rounded-2xl bg-[#3B82F6]/10 flex items-center justify-center mx-auto mb-3">
                                      <Bell className="size-6 text-[#3B82F6] opacity-60" />
                                    </div>
                                    <p className="text-sm font-semibold text-[#F2F2F2] mb-1">Todo al día</p>
                                    <p className="text-xs text-[#888891]">No tienes notificaciones pendientes</p>
                                  </div>
                                ) : (
                                  notifications.map((notif) => {
                                    const cat = getNotifCategory(notif);
                                    const inner = (
                                      <div className={`flex gap-3 px-3 py-3 mx-1.5 my-0.5 rounded-lg hover:bg-[#222226] transition-colors cursor-pointer relative ${!notif.is_read ? "bg-[#3B82F6]/5" : ""}`}>
                                        {!notif.is_read && (
                                          <div className="absolute top-3 left-1 w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />
                                        )}
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cat === "social" ? "bg-blue-500/15 text-blue-500" : cat === "marketplace" ? "bg-orange-500/15 text-orange-500" : cat === "tournament" ? "bg-purple-500/15 text-purple-500" : "bg-[rgba(255,255,255,0.08)] text-[#888891]"}`}>
                                          {cat === "social" && <Person className="size-4" />}
                                          {cat === "marketplace" && <ShoppingCart className="size-4" />}
                                          {cat === "tournament" && <StarFill className="size-4" />}
                                          {cat === "system" && <Bell className="size-4" />}
                                        </div>
                                        <div className="flex flex-col flex-1 leading-snug min-w-0">
                                          <p className={`text-[13px] text-[#F2F2F2] leading-relaxed ${!notif.is_read ? "font-semibold" : ""}`}>
                                            {stripHtml(notif.title || "Nueva notificación")}
                                          </p>
                                          <p className="text-[11px] text-[#888891] mt-1 font-medium">{timeAgo(notif.created_at)}</p>
                                        </div>
                                      </div>
                                    );
                                    return notif.action_url ? (
                                      <Link key={notif.id} href={notif.action_url}>{inner}</Link>
                                    ) : (
                                      <div key={notif.id}>{inner}</div>
                                    );
                                  })
                                )}
                              </div>
                            </ScrollShadow>
                          </div>

                          {/* Footer */}
                          {notifications.length > 0 && (
                            <div className="p-2 border-t border-[rgba(255,255,255,0.06)]">
                              <Link href="/notificaciones" className="flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-semibold text-[#3B82F6] hover:bg-[#3B82F6]/10 transition-colors">
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
                        className="flex items-center justify-center min-w-8 min-h-8 rounded-full shadow-brand-sm bg-[#3B82F6] text-[#ffffff] cursor-pointer hover:scale-105 active:scale-95 transition-transform"
                        aria-label="Crear"
                      >
                        <Plus className="size-4 font-bold" />
                      </Popover.Trigger>
                      <Popover.Content className="w-[260px] max-w-[calc(100vw-2rem)] p-0 overflow-hidden glass-sm shadow-xl !rounded-[22px]">
                        <div className="px-3.5 py-2.5 border-b border-[rgba(255,255,255,0.06)] bg-[#222226]">
                          <p className="text-xs font-bold uppercase tracking-wider text-[#888891]">Crear nuevo</p>
                        </div>
                        <div className="p-1.5 flex flex-col gap-0.5">
                          <Link href="/feed/new" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#222226] transition-colors group cursor-pointer">
                            <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center shrink-0 group-hover:bg-blue-500/25 transition-colors">
                              <Pencil className="size-4 text-blue-500" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-[#F2F2F2]">Crear Post</p>
                              <p className="text-[11px] text-[#888891] leading-tight">Comparte con la comunidad</p>
                            </div>
                          </Link>
                          <Link href="/decks/new" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#222226] transition-colors group cursor-pointer">
                            <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center shrink-0 group-hover:bg-purple-500/25 transition-colors">
                              <SquareDashed className="size-4 text-purple-500" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-[#F2F2F2]">Publicar Mazo</p>
                              <p className="text-[11px] text-[#888891] leading-tight">Muestra tu mejor deck</p>
                            </div>
                          </Link>
                          <Link href="/marketplace/new" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#222226] transition-colors group cursor-pointer">
                            <div className="w-8 h-8 rounded-lg bg-orange-500/15 flex items-center justify-center shrink-0 group-hover:bg-orange-500/25 transition-colors">
                              <ShoppingCart className="size-4 text-orange-500" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-[#F2F2F2]">Vender Carta</p>
                              <p className="text-[11px] text-[#888891] leading-tight">Listado en el marketplace</p>
                            </div>
                          </Link>
                          <Link href="/torneos/new" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#222226] transition-colors group cursor-pointer">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0 group-hover:bg-emerald-500/25 transition-colors">
                              <Cup className="size-4 text-emerald-500" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-[#F2F2F2]">Crear Torneo</p>
                              <p className="text-[11px] text-[#888891] leading-tight">Organiza un evento competitivo</p>
                            </div>
                          </Link>
                        </div>
                      </Popover.Content>
                    </Popover>

                    {/* Avatar dropdown */}
                    <div className="ml-1">
                      <Popover>
                        <Popover.Trigger className="rounded-full cursor-pointer flex border-2 border-transparent hover:border-[#3B82F6]/40 transition-colors outline-none">
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
                            <div className="absolute top-0 inset-x-0 h-0.5 bg-[#3B82F6]" />
                            <div className="flex items-center gap-3 px-4 py-4 pt-5">
                              <Avatar size="sm" className="ring-2 ring-[#3B82F6]/30">
                                <Avatar.Image
                                  alt="Avatar"
                                  src={userAvatarUrl || undefined}
                                />
                                <Avatar.Fallback delayMs={600}>
                                  {session?.username?.[0]?.toUpperCase() || "U"}
                                </Avatar.Fallback>
                              </Avatar>
                              <div className="flex flex-col min-w-0">
                                <p className="text-sm font-bold text-[#F2F2F2] truncate">{session?.username}</p>
                                <p className="text-[11px] text-[#888891] truncate">{session?.email}</p>
                              </div>
                            </div>
                          </div>

                          {/* Menu Sections */}
                          <div className="border-t border-[rgba(255,255,255,0.06)]">
                            <div className="p-1.5">
                              <p className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#888891]">Mi cuenta</p>
                              <Link href="/perfil/me" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#222226] transition-colors cursor-pointer">
                                <Person className="size-4 text-[#888891]" />
                                <span className="text-sm text-[#F2F2F2]">Mi Perfil</span>
                              </Link>
                              <Link href="/config" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#222226] transition-colors cursor-pointer">
                                <Gear className="size-4 text-[#888891]" />
                                <span className="text-sm text-[#F2F2F2]">Configuración</span>
                              </Link>
                            </div>

                            <div className="border-t border-[rgba(255,255,255,0.06)] p-1.5">
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
                        className="font-bold px-5 h-9 rounded-full bg-[#3B82F6] text-white shadow-none"
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
