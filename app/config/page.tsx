"use client";

import { useState, useEffect, useRef, CSSProperties } from "react";
import { useAuth } from "@/context/AuthContext";
import { changePassword } from "@/lib/api/auth";
import { getNotificationPreferences, updateNotificationPreferences } from "@/lib/api/notifications";
import type { NotificationPreferences } from "@/lib/types/notification";
import { getUserProfile, updateProfile } from "@/lib/api/social";
import { uploadMarketplaceImage } from "@/lib/api/marketplace";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ── Colors ──
const C = {
  bg: "var(--background)",
  surface: "var(--surface-solid)",
  border: "var(--border)",
  text: "var(--foreground)",
  muted: "var(--muted)",
  gray: "var(--muted)",
  accent: "var(--accent)",
  danger: "var(--danger)",
  dangerBg: "rgba(237,66,69,0.1)",
  iconBg: "var(--surface-solid)",
  switchOff: "var(--muted)",
  switchOn: "var(--foreground)",
  versionText: "var(--muted)",
};

// ── Inline SVG Icons ──
function IconPerson() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
function IconMail() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}
function IconEdit() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}
function IconLock() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
function IconChevron() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.gray} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
function IconBack() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}
function IconClose() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18" /><path d="m6 6 12 12" />
    </svg>
  );
}
function IconLogout() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.danger} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
function IconDiscord() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={C.muted}>
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.947 2.418-2.157 2.418z" />
    </svg>
  );
}
function IconGoogle() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={C.muted}>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}
function IconDoc() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}
function IconShield() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

// ── Custom Toggle ──
function Toggle({ value, onChange, disabled }: { value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  const trackStyle: CSSProperties = {
    width: 51,
    height: 31,
    borderRadius: 16,
    backgroundColor: value ? C.switchOn : C.switchOff,
    position: "relative",
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "background-color 0.2s",
    flexShrink: 0,
    opacity: disabled ? 0.5 : 1,
  };
  const thumbStyle: CSSProperties = {
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: "#fff",
    position: "absolute",
    top: 2,
    left: value ? 22 : 2,
    transition: "left 0.2s",
    boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
  };
  return (
    <div style={trackStyle} onClick={() => !disabled && onChange(!value)}>
      <div style={thumbStyle} />
    </div>
  );
}

// ── Section Title ──
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 600, color: C.muted, letterSpacing: 1, marginBottom: 8, marginLeft: 4, textTransform: "uppercase" as const }}>
      {children}
    </div>
  );
}

// ── Card wrapper ──
function SCard({ children, style }: { children: React.ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ backgroundColor: C.surface, borderRadius: 16, border: `0.5px solid ${C.border}`, overflow: "hidden", ...style }}>
      {children}
    </div>
  );
}

// ── Row ──
function Row({ icon, label, value, chevron, danger, onClick, style }: {
  icon?: React.ReactNode; label: string; value?: string; chevron?: boolean; danger?: boolean; onClick?: () => void; style?: CSSProperties;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        minHeight: 56, paddingLeft: 16, paddingRight: 16,
        display: "flex", flexDirection: "row", alignItems: "center",
        cursor: onClick ? "pointer" : "default", ...style,
      }}
    >
      {icon && (
        <div style={{
          width: 32, height: 32, borderRadius: 16,
          backgroundColor: danger ? C.dangerBg : C.iconBg,
          display: "flex", alignItems: "center", justifyContent: "center", marginRight: 12, flexShrink: 0,
        }}>
          {icon}
        </div>
      )}
      <span style={{ fontSize: 15, color: danger ? C.danger : C.text, flex: 1 }}>{label}</span>
      {value && <span style={{ fontSize: 13, color: C.gray, marginRight: chevron ? 8 : 0 }}>{value}</span>}
      {chevron && <IconChevron />}
    </div>
  );
}

// ── Divider ──
function Divider() {
  return <div style={{ height: 0.5, backgroundColor: C.border, marginLeft: 60 }} />;
}

// ── Toggle Row ──
function ToggleRow({ label, value, onChange, disabled }: { label: string; value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <div style={{ minHeight: 56, paddingLeft: 16, paddingRight: 16, display: "flex", flexDirection: "row", alignItems: "center" }}>
      <span style={{ fontSize: 15, color: C.text, flex: 1 }}>{label}</span>
      <Toggle value={value} onChange={onChange} disabled={disabled} />
    </div>
  );
}

// ── Modal Wrapper ──
function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        backgroundColor: "rgba(0,0,0,0.6)",
        display: "flex", flexDirection: "column",
      }}
      className="md:items-center md:justify-center md:p-4"
    >
      <div
        style={{
          backgroundColor: C.bg,
          display: "flex", flexDirection: "column",
          overflowY: "auto",
        }}
        className="flex-1 md:flex-none md:w-full md:max-w-[440px] md:rounded-2xl md:border md:border-border md:max-h-[80vh]"
      >
        {children}
      </div>
    </div>
  );
}

export default function ConfigPage() {
  const { session, status, logout } = useAuth();
  const token = session?.accessToken;
  const router = useRouter();
  const queryClient = useQueryClient();

  // ── Edit Profile state ──
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileBio, setProfileBio] = useState("");
  const [profileCity, setProfileCity] = useState("");
  const [profileCountry, setProfileCountry] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // ── Password modal state ──
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  // ── Notification prefs ──
  const [localNotifPrefs, setLocalNotifPrefs] = useState<NotificationPreferences>({
    tournament_updates: true,
    match_reminders: true,
    marketplace_offers: true,
    price_alerts: true,
    social_interactions: true,
    clan_activity: true,
    system_announcements: true,
  });

  // ── Privacy toggles (local only for now) ──
  const [privacyElo, setPrivacyElo] = useState(true);
  const [privacySearch, setPrivacySearch] = useState(true);
  const [privacyProfile, setPrivacyProfile] = useState(true);
  const [privacyMessages, setPrivacyMessages] = useState(true);

  // ── Desktop section nav ──
  type ConfigSection = "cuenta" | "notificaciones" | "privacidad" | "vinculadas" | "info";
  const [activeSection, setActiveSection] = useState<ConfigSection>("cuenta");

  const SECTIONS: { key: ConfigSection; label: string }[] = [
    { key: "cuenta", label: "Cuenta" },
    { key: "notificaciones", label: "Notificaciones" },
    { key: "privacidad", label: "Privacidad" },
    { key: "vinculadas", label: "Cuentas vinculadas" },
    { key: "info", label: "Información" },
  ];

  const { data: notifPrefs } = useQuery({
    queryKey: ["notificationPreferences"],
    queryFn: () => getNotificationPreferences(token!),
    enabled: !!token,
  });

  const updatePrefsMutation = useMutation({
    mutationFn: (newPrefs: Partial<NotificationPreferences>) => updateNotificationPreferences(newPrefs, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificationPreferences"] });
    },
  });

  useEffect(() => {
    if (notifPrefs?.preferences) {
      setLocalNotifPrefs(notifPrefs.preferences);
    }
  }, [notifPrefs]);

  useEffect(() => {
    if (session?.username) {
      getUserProfile(session.username).then((res: unknown) => {
        const raw = (res as Record<string, unknown>)?.data ?? res;
        const profile = (raw as Record<string, unknown>)?.user ?? raw;
        const p = profile as Record<string, unknown>;
        if (p?.avatar_url) setAvatarUrl(p.avatar_url as string);
        if (p?.name) setProfileName(p.name as string);
        if (p?.bio) setProfileBio(p.bio as string);
        if (p?.city) setProfileCity(p.city as string);
        if (p?.country) setProfileCountry(p.country as string);
      }).catch(() => {});
    }
  }, [session?.username]);

  const handleToggleNotif = (key: keyof NotificationPreferences, val: boolean) => {
    setLocalNotifPrefs((prev) => ({ ...prev, [key]: val }));
    updatePrefsMutation.mutate({ [key]: val });
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    if (!file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) return;
    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await uploadMarketplaceImage(formData);
      const r = uploadRes as Record<string, unknown>;
      const d = r?.data as Record<string, unknown> | undefined;
      const newUrl = (r?.url || d?.url) as string | undefined;
      if (newUrl) {
        await updateProfile({ avatar_url: newUrl }, token);
        setAvatarUrl(newUrl);
      }
    } catch {
      // silent
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!token) return;
    setIsSavingProfile(true);
    try {
      await updateProfile({
        display_name: profileName,
        bio: profileBio,
        city: profileCity,
        country: profileCountry,
      }, token);
      setEditModalOpen(false);
    } catch {
      // silent
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError("");
    setPasswordSuccess("");
    if (newPassword !== confirmPassword) {
      setPasswordError("Las contraseñas no coinciden");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("Mínimo 8 caracteres");
      return;
    }
    setIsChangingPassword(true);
    try {
      await changePassword(currentPassword, newPassword, token!);
      setPasswordSuccess("Contraseña actualizada");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setPasswordError("Error al cambiar contraseña");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  // ── Loading / unauthenticated ──
  if (status === "loading") {
    return (
      <div style={{ backgroundColor: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 32, height: 32, border: `2px solid ${C.accent}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div style={{ backgroundColor: C.bg, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: C.text }}>Inicia sesión</span>
        <span style={{ fontSize: 14, color: C.muted }}>Debes iniciar sesión para acceder a ajustes.</span>
      </div>
    );
  }

  const inputStyle: CSSProperties = {
    width: "100%",
    backgroundColor: "transparent",
    border: "none",
    outline: "none",
    fontSize: 14,
    color: C.text,
    padding: "12px 16px",
  };

  // ── Section JSX blocks ──
  const sectionCuenta = (
    <div>
      <SectionTitle>Cuenta</SectionTitle>
      <SCard>
        <Row icon={<IconPerson />} label="Usuario" value={session?.username || "—"} />
        <Divider />
        <Row icon={<IconMail />} label="Email" value={session?.email || "—"} />
        <Divider />
        <Row icon={<IconLock />} label="Cambiar contraseña" chevron onClick={() => setPasswordModalOpen(true)} />
      </SCard>
    </div>
  );

  const sectionNotificaciones = (
    <div>
      <SectionTitle>Notificaciones</SectionTitle>
      <SCard>
        <ToggleRow label="Torneos" value={localNotifPrefs.tournament_updates} onChange={(v) => handleToggleNotif("tournament_updates", v)} disabled={updatePrefsMutation.isPending} />
        <Divider />
        <ToggleRow label="Recordatorios de partidas" value={localNotifPrefs.match_reminders} onChange={(v) => handleToggleNotif("match_reminders", v)} disabled={updatePrefsMutation.isPending} />
        <Divider />
        <ToggleRow label="Ofertas del marketplace" value={localNotifPrefs.marketplace_offers} onChange={(v) => handleToggleNotif("marketplace_offers", v)} disabled={updatePrefsMutation.isPending} />
        <Divider />
        <ToggleRow label="Alertas de precios" value={localNotifPrefs.price_alerts} onChange={(v) => handleToggleNotif("price_alerts", v)} disabled={updatePrefsMutation.isPending} />
        <Divider />
        <ToggleRow label="Interacciones sociales" value={localNotifPrefs.social_interactions} onChange={(v) => handleToggleNotif("social_interactions", v)} disabled={updatePrefsMutation.isPending} />
        <Divider />
        <ToggleRow label="Actividad del clan" value={localNotifPrefs.clan_activity} onChange={(v) => handleToggleNotif("clan_activity", v)} disabled={updatePrefsMutation.isPending} />
        <Divider />
        <ToggleRow label="Mensajes de chat" value={localNotifPrefs.social_interactions} onChange={(v) => handleToggleNotif("social_interactions", v)} disabled={updatePrefsMutation.isPending} />
        <Divider />
        <ToggleRow label="Anuncios del sistema" value={localNotifPrefs.system_announcements} onChange={(v) => handleToggleNotif("system_announcements", v)} disabled={updatePrefsMutation.isPending} />
      </SCard>
    </div>
  );

  const sectionPrivacidad = (
    <div>
      <SectionTitle>Privacidad</SectionTitle>
      <SCard>
        <ToggleRow label="ELO publico" value={privacyElo} onChange={setPrivacyElo} />
        <Divider />
        <ToggleRow label="Visible en busquedas" value={privacySearch} onChange={setPrivacySearch} />
        <Divider />
        <ToggleRow label="Perfil publico" value={privacyProfile} onChange={setPrivacyProfile} />
        <Divider />
        <ToggleRow label="Permitir mensajes de cualquiera" value={privacyMessages} onChange={setPrivacyMessages} />
      </SCard>
    </div>
  );

  const sectionVinculadas = (
    <div>
      <SectionTitle>Cuentas vinculadas</SectionTitle>
      <SCard>
        <Row icon={<IconDiscord />} label="Discord" value="Proximamente" />
        <Divider />
        <Row icon={<IconGoogle />} label="Google" value="Proximamente" />
      </SCard>
    </div>
  );

  const sectionInfo = (
    <div>
      <SectionTitle>Información</SectionTitle>
      <SCard>
        <Link href="/terminos" style={{ textDecoration: "none" }}>
          <Row icon={<IconDoc />} label="Términos de servicio" chevron />
        </Link>
        <Divider />
        <Link href="/privacidad" style={{ textDecoration: "none" }}>
          <Row icon={<IconShield />} label="Política de privacidad" chevron />
        </Link>
      </SCard>
    </div>
  );

  const sectionLogout = (
    <>
      <div style={{ marginTop: 24 }}>
        <SCard>
          <Row icon={<IconLogout />} label="Cerrar sesión" danger onClick={handleLogout} />
        </SCard>
      </div>
      <div style={{ marginTop: 16, textAlign: "center" }}>
        <button style={{ background: "none", border: "none", color: C.gray, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
          Eliminar cuenta
        </button>
      </div>
      <div style={{ marginTop: 12, textAlign: "center", paddingBottom: 32 }}>
        <span style={{ color: C.versionText, fontSize: 12 }}>Rankeao v1.0.0</span>
      </div>
    </>
  );

  const desktopSectionContent: Record<ConfigSection, React.ReactNode> = {
    cuenta: sectionCuenta,
    notificaciones: sectionNotificaciones,
    privacidad: sectionPrivacidad,
    vinculadas: sectionVinculadas,
    info: sectionInfo,
  };

  return (
    <div style={{ backgroundColor: C.bg, minHeight: "100vh" }}>

      {/* ══════ MOBILE (scroll all sections) ══════ */}
      <div className="md:hidden">
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px" }}>
          <button
            onClick={() => router.back()}
            style={{
              width: 36, height: 36, borderRadius: 18, backgroundColor: C.surface,
              border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
            }}
          >
            <IconBack />
          </button>
          <span style={{ fontSize: 18, fontWeight: 800, color: C.text }}>Ajustes</span>
        </div>

        {/* Scrollable content */}
        <div style={{ padding: "0 16px", paddingBottom: 60 }}>

        <div style={{ marginTop: 8 }}>{sectionCuenta}</div>
        <div style={{ marginTop: 24 }}>{sectionNotificaciones}</div>
        <div style={{ marginTop: 24 }}>{sectionPrivacidad}</div>
        <div style={{ marginTop: 24 }}>{sectionVinculadas}</div>
        <div style={{ marginTop: 24 }}>{sectionInfo}</div>
        {sectionLogout}
      </div>
      </div>

      {/* ══════ DESKTOP (sidebar nav + content) ══════ */}
      <div className="hidden md:flex items-start" style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px 48px 16px", gap: 24, minHeight: "calc(100vh - 64px)" }}>
        {/* Sidebar nav */}
        <div style={{ width: 220, flexShrink: 0, position: "sticky", top: 80 }}>
            <p style={{ color: C.muted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 12, marginLeft: 12 }}>
              Ajustes
            </p>
            <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {SECTIONS.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setActiveSection(s.key)}
                  style={{
                    display: "flex", alignItems: "center", padding: "10px 12px",
                    borderRadius: 10, border: "none", cursor: "pointer",
                    backgroundColor: activeSection === s.key ? "var(--surface-solid)" : "transparent",
                    color: activeSection === s.key ? C.text : C.muted,
                    fontSize: 14, fontWeight: activeSection === s.key ? 600 : 500,
                    textAlign: "left", width: "100%",
                    transition: "background 0.15s",
                  }}
                >
                  {s.label}
                </button>
              ))}

              {/* Divider */}
              <div style={{ height: 1, backgroundColor: C.border, margin: "8px 12px" }} />

              {/* Logout */}
              <button
                onClick={handleLogout}
                style={{
                  display: "flex", alignItems: "center", padding: "10px 12px",
                  borderRadius: 10, border: "none", cursor: "pointer",
                  backgroundColor: "transparent", color: C.danger,
                  fontSize: 14, fontWeight: 500, textAlign: "left", width: "100%",
                }}
              >
                Cerrar sesión
              </button>
            </nav>

            <div style={{ marginTop: 24, textAlign: "center" }}>
              <span style={{ color: C.versionText, fontSize: 11 }}>Rankeao v1.0.0</span>
            </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {desktopSectionContent[activeSection]}
        </div>
      </div>

      {/* ═══════════ CHANGE PASSWORD MODAL ═══════════ */}
      <Modal open={passwordModalOpen} onClose={() => setPasswordModalOpen(false)}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: `1px solid ${C.border}` }}>
          <button onClick={() => { setPasswordModalOpen(false); setPasswordError(""); setPasswordSuccess(""); }} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: C.surface, border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <IconClose />
          </button>
          <span style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Cambiar contraseña</span>
        </div>

        {/* Form */}
        <div style={{ padding: "20px 16px", flex: 1 }}>
          {passwordError && (
            <div style={{ backgroundColor: C.dangerBg, padding: "10px 16px", borderRadius: 12, marginBottom: 16 }}>
              <span style={{ color: C.danger, fontSize: 13 }}>{passwordError}</span>
            </div>
          )}
          {passwordSuccess && (
            <div style={{ backgroundColor: "rgba(52,199,89,0.1)", padding: "10px 16px", borderRadius: 12, marginBottom: 16 }}>
              <span style={{ color: "var(--success)", fontSize: 13 }}>{passwordSuccess}</span>
            </div>
          )}

          <SectionTitle>Contraseña actual</SectionTitle>
          <SCard style={{ marginBottom: 16 }}>
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" style={inputStyle} />
          </SCard>

          <SectionTitle>Nueva contraseña</SectionTitle>
          <SCard style={{ marginBottom: 16 }}>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" style={inputStyle} />
          </SCard>

          <SectionTitle>Confirmar contraseña</SectionTitle>
          <SCard style={{ marginBottom: 24 }}>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" style={inputStyle} />
          </SCard>

          {/* Save button — right below fields */}
          <button
            onClick={handleChangePassword}
            disabled={isChangingPassword}
            style={{
              width: "100%", backgroundColor: C.accent, border: "none", borderRadius: 12,
              padding: "14px 0", cursor: "pointer", opacity: isChangingPassword ? 0.5 : 1,
              fontSize: 14, fontWeight: 700, color: "#fff", textAlign: "center",
            }}
          >
            {isChangingPassword ? "Guardando..." : "Guardar contraseña"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
