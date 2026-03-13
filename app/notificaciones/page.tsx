"use client";

import { useState, useEffect } from "react";
import { Badge, ScrollShadow, Button, Chip } from "@heroui/react";
import { useAuth } from "@/context/AuthContext";
import { Person, Bell, ShoppingCart, StarFill } from "@gravity-ui/icons";
import { getNotifications, getUnreadNotificationCount, markAllNotificationsRead } from "@/lib/api/notifications";

type AppNotification = {
  id: string;
  type: "social" | "marketplace" | "tournament" | "system";
  message?: string;
  data?: any;
  created_at: string;
  is_read?: boolean;
};

export default function NotificacionesPage() {
  const { session, status } = useAuth();
  const isAuthenticated = status === "authenticated" && Boolean(session?.email);

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    if (isAuthenticated && session?.accessToken) {
      setLoading(true);
      Promise.all([
        getNotifications({ limit: 50 }, session.accessToken).catch(() => null),
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
        setLoading(false);
      });
    }
  }, [isAuthenticated, session]);

  const handleMarkAllRead = async () => {
    if (!isAuthenticated || !session?.accessToken) return;
    setMarkingAll(true);
    try {
      await markAllNotificationsRead(session.accessToken);
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {}
    setMarkingAll(false);
  };

  return (
    <main className="max-w-lg mx-auto px-4 py-8">
      <section className="mb-6">
        <div
          className="p-5 sm:p-6 rounded-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 border border-[var(--border)] bg-[var(--surface)]"
        >
          <div className="relative z-10 flex-1">
            <Chip color="accent" variant="soft" size="sm" className="mb-3 px-3">
              Novedades / Social / Torneos
            </Chip>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[var(--foreground)] to-[var(--muted)] mb-2">
              Notificaciones
            </h1>
            <p className="text-sm text-[var(--muted)] max-w-lg mb-6">
              Aquí encontrarás todas las actualizaciones relevantes, desde interacciones sociales hasta novedades de torneos y el marketplace.
            </p>
          </div>
        </div>
      </section>
      <div className="p-5 sm:p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
        <ScrollShadow className="max-h-[70vh] w-full custom-scrollbar">
          <div className="flex flex-col">
            {loading ? (
              <div className="py-10 px-6 text-center text-[var(--muted)]">Cargando notificaciones...</div>
            ) : notifications.length === 0 ? (
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
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0
                      ${notif.type === "social"
                        ? "bg-[var(--accent)]/15 text-[var(--accent)]"
                        : notif.type === "marketplace"
                        ? "bg-[var(--success)]/15 text-[var(--success)]"
                        : notif.type === "tournament"
                        ? "bg-[var(--warning)]/15 text-[var(--warning)]"
                        : "bg-[var(--default)] text-[var(--muted)]"}
                    `}
                  >
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
    </main>
  );
}
