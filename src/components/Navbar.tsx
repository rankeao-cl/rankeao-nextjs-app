"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Avatar, Button, Badge, Dropdown, Popover, ScrollShadow } from "@heroui/react";
import { useAuth } from "@/context/AuthContext";
import {
  ArrowRightFromSquare,
  Person,
  Bell,
  Magnifier,
  ShoppingCart,
  StarFill,
} from "@gravity-ui/icons";
import { getNotifications, getUnreadNotificationCount, markAllNotificationsRead } from "@/lib/api";

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
  const { session, status, logout } = useAuth();
  const isAuthenticated = status === "authenticated" && Boolean(session?.email);

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

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
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div
            className="w-8 h-8 rounded-lg overflow-hidden shadow-brand-sm"
            style={{
              border: "1px solid oklch(from var(--border) l c h / 0.4)",
              background: "var(--surface)",
            }}
          >
            <Image
              src="/logo.png"
              alt="Rankeao logo"
              width={32}
              height={32}
              className="w-full h-full object-cover"
              priority
            />
          </div>
          <div className="leading-none hidden sm:block">
            <p className="font-bold tracking-wide text-lg" style={{ color: "var(--foreground)" }}>
              Rankeao
            </p>
            <p
              className="text-[10px] uppercase tracking-[0.2em]"
              style={{ color: "var(--muted)" }}
            >
              Chile TCG
            </p>
          </div>
        </Link>

        {/* Search bar — desktop */}
        <div className="hidden md:flex flex-1 max-w-md">
          <div
            className="flex items-center gap-2 w-full rounded-lg px-3 py-2 text-sm"
            style={{
              background: "var(--field-background)",
              border: "1px solid var(--border)",
              color: "var(--field-foreground)",
            }}
          >
            <Magnifier className="size-4 shrink-0" style={{ color: "var(--field-placeholder)" }} />
            <input
              type="text"
              placeholder="Buscar jugadores, torneos, cartas..."
              className="w-full bg-transparent outline-none placeholder:text-[var(--field-placeholder)]"
            />
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Mobile search icon */}
          <Button
            isIconOnly
            variant="tertiary"
            size="sm"
            className="md:hidden text-[var(--muted)]"
          >
            <Magnifier className="size-4" />
          </Button>

          {isAuthenticated ? (
            <>
              {/* Notifications */}
              <Popover>
                <Popover.Trigger>
                  <Button
                    isIconOnly
                    variant="tertiary"
                    size="sm"
                    className="relative overflow-visible p-0 min-w-8 min-h-8 text-[var(--muted)]"
                  >
                    <Badge.Anchor>
                      <Bell className="size-[18px]" />
                      {unreadCount > 0 && (
                        <Badge color="danger" size="sm" className="absolute -top-1.5 -right-1.5 z-10 scale-80 border-2 border-[var(--background)]">
                          {unreadCount > 9 ? "+9" : unreadCount}
                        </Badge>
                      )}
                    </Badge.Anchor>
                  </Button>
                </Popover.Trigger>
                <Popover.Content className="w-[320px] p-0 overflow-hidden bg-[var(--surface)] border border-[var(--border)] shadow-xl rounded-xl">
                  <div className="flex flex-col w-full">
                    <div className="px-4 py-3 border-b border-[var(--border)] flex justify-between items-center bg-[var(--surface-secondary)]">
                      <h3 className="font-bold text-sm text-[var(--foreground)]">Notificaciones</h3>
                      <Link href="/perfil/ajustes" className="text-[10px] text-[var(--accent)] hover:underline font-bold">Ajustes</Link>
                    </div>
                    <ScrollShadow className="max-h-[320px] w-full custom-scrollbar">
                      <div className="flex flex-col">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-[var(--muted)] text-sm">
                            <Bell className="size-6 mx-auto mb-2 opacity-50" />
                            No tienes notificaciones
                          </div>
                        ) : (
                          notifications.map((notif) => (
                            <div key={notif.id} className={`flex gap-3 p-4 border-b border-[var(--separator)] hover:bg-[var(--surface-secondary)] transition-colors cursor-pointer ${!notif.is_read ? "bg-[var(--accent)]/5" : ""}`}>
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border ${notif.type === "social" ? "bg-blue-500/20 text-blue-500 border-blue-500/30" : notif.type === "marketplace" ? "bg-orange-500/20 text-orange-400 border-orange-500/30" : notif.type === "tournament" ? "bg-purple-500/20 text-purple-400 border-purple-500/30" : "bg-zinc-500/20 text-zinc-400 border-zinc-500/30"}`}>
                                {notif.type === "social" && <Person className="size-4.5" />}
                                {notif.type === "marketplace" && <ShoppingCart className="size-4.5" />}
                                {notif.type === "tournament" && <StarFill className="size-4.5" />}
                                {notif.type === "system" && <Bell className="size-4.5" />}
                              </div>
                              <div className="flex flex-col flex-1 leading-snug">
                                <p className="text-sm text-[var(--foreground)]" dangerouslySetInnerHTML={{ __html: notif.message || "Nueva notificación" }} />
                                <p className="text-[11px] text-[var(--muted)] mt-1.5 font-medium">hace instantes</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollShadow>
                    {notifications.length > 0 && (
                      <div className="p-2 border-t border-[var(--border)] text-center bg-[var(--surface-secondary)]">
                        <Button onPress={handleMarkAllRead} variant="tertiary" size="sm" className="text-xs text-[var(--muted)] w-full font-semibold">
                          Marcar todas como leídas
                        </Button>
                      </div>
                    )}
                  </div>
                </Popover.Content>
              </Popover>

              {/* Avatar dropdown */}
              <Dropdown>
                <Dropdown.Trigger className="rounded-full">
                  <Avatar size="sm">
                    <Avatar.Image
                      alt="Avatar"
                      src="https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/blue.jpg"
                    />
                    <Avatar.Fallback delayMs={600}>
                      {session?.username?.[0]?.toUpperCase() || "U"}
                    </Avatar.Fallback>
                  </Avatar>
                </Dropdown.Trigger>
                <Dropdown.Popover>
                  <div className="px-3 pt-3 pb-1">
                    <div className="flex items-center gap-2">
                      <Avatar size="sm">
                        <Avatar.Image
                          alt="Avatar"
                          src="https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/blue.jpg"
                        />
                        <Avatar.Fallback delayMs={600}>
                          {session?.username?.[0]?.toUpperCase() || "U"}
                        </Avatar.Fallback>
                      </Avatar>
                      <div className="flex flex-col gap-0">
                        <p className="text-sm leading-5 font-medium">
                          {session?.username}
                        </p>
                        <p className="text-xs leading-none" style={{ color: "var(--muted)" }}>
                          {session?.email}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Dropdown.Menu>
                    <Dropdown.Item
                      id="profile"
                      textValue="Profile"
                      onPress={() => {
                        window.location.href = "/perfil";
                      }}
                    >
                      <div className="flex w-full items-center justify-between gap-2">
                        <span>Perfil</span>
                        <Person className="size-3.5" style={{ color: "var(--muted)" }} />
                      </div>
                    </Dropdown.Item>
                    <Dropdown.Item
                      id="logout"
                      textValue="Logout"
                      variant="danger"
                      onPress={() => {
                        logout();
                      }}
                    >
                      <div className="flex w-full items-center justify-between gap-2">
                        <span>Cerrar Sesión</span>
                        <ArrowRightFromSquare className="size-3.5 text-danger" />
                      </div>
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown.Popover>
              </Dropdown>
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
    </header>
  );
}
