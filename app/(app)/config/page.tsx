"use client";

import { useState, useEffect, useRef, CSSProperties, useCallback } from "react";
import { useAuth } from "@/lib/hooks/use-auth";
import { changePassword } from "@/lib/api/auth";
import { getNotificationPreferences, batchUpdateNotificationPreferences } from "@/lib/api/notifications";
import type { NotificationPreferences } from "@/lib/types/notification";
import { getUserProfile, updateProfile } from "@/lib/api/social";
import { uploadMarketplaceImage } from "@/lib/api/marketplace";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";

// ── Colors ──
const C = {
  bg: "var(--background)",
  surface: "var(--surface)",
  surfaceSolid: "var(--surface-solid)",
  border: "var(--border)",
  text: "var(--foreground)",
  muted: "var(--muted)",
  accent: "var(--accent)",
  danger: "var(--danger)",
  dangerBg: "color-mix(in srgb, var(--danger) 12%, transparent)",
  switchOff: "var(--muted)",
  switchOn: "var(--accent)",
  versionText: "var(--muted)",
};

// ── Section type ──
type ConfigSection = "perfil" | "cuenta" | "notificaciones" | "privacidad" | "apariencia" | "info";

interface SectionDef {
  key: ConfigSection;
  label: string;
  icon: React.ReactNode;
}

const NOTIF_MAP: Record<keyof NotificationPreferences, { category: string; channel: string }> = {
  tournament_updates: { category: "tournament", channel: "IN_APP" },
  match_reminders: { category: "tournament", channel: "PUSH" },
  social_interactions: { category: "social", channel: "IN_APP" },
  clan_activity: { category: "social", channel: "PUSH" },
  marketplace_offers: { category: "marketplace", channel: "IN_APP" },
  price_alerts: { category: "marketplace", channel: "PUSH" },
  system_announcements: { category: "system", channel: "IN_APP" },
};

// ── Inline SVG Icons (16px default) ──
function IconPerson({ size = 16, color = C.muted }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
function IconKey({ size = 16, color = C.muted }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </svg>
  );
}
function IconBell({ size = 16, color = C.muted }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}
function IconShield({ size = 16, color = C.muted }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
function IconPalette({ size = 16, color = C.muted }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13.5" cy="6.5" r="0.5" fill={color} /><circle cx="17.5" cy="10.5" r="0.5" fill={color} /><circle cx="8.5" cy="7.5" r="0.5" fill={color} /><circle cx="6.5" cy="12" r="0.5" fill={color} />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
    </svg>
  );
}
function IconInfo({ size = 16, color = C.muted }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
    </svg>
  );
}
function IconChevron() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
function IconBack() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.text} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
function IconLogout({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={C.danger} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
function IconMail({ size = 16, color = C.muted }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}
function IconLock({ size = 16, color = C.muted }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
function IconAt({ size = 16, color = C.muted }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" /><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94" />
    </svg>
  );
}
function IconDiscord({ size = 16, color = C.muted }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.947 2.418-2.157 2.418z" />
    </svg>
  );
}
function IconGoogle({ size = 16, color = C.muted }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}
function IconDoc({ size = 16, color = C.muted }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}
function IconEdit({ size = 16, color = C.muted }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}
function IconCamera({ size = 16, color = "var(--accent-foreground)" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}
function IconGlobe({ size = 16, color = C.muted }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}
function IconGamepad({ size = 16, color = C.muted }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="6" y1="12" x2="10" y2="12" /><line x1="8" y1="10" x2="8" y2="14" /><line x1="15" y1="13" x2="15.01" y2="13" /><line x1="18" y1="11" x2="18.01" y2="11" />
      <rect x="2" y="6" width="20" height="12" rx="2" />
    </svg>
  );
}
function IconSun({ size = 16, color = C.muted }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}
function IconMoon({ size = 16, color = C.muted }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}
function IconMonitor({ size = 16, color = C.muted }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}
function IconExternalLink({ size = 14, color = C.muted }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}
function IconTrash({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={C.danger} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

// ── Custom Toggle (44x26 with smooth animation) ──
function Toggle({ value, onChange, disabled }: { value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  const trackStyle: CSSProperties = {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: value ? C.switchOn : C.switchOff,
    position: "relative",
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "background-color 0.25s ease",
    flexShrink: 0,
    opacity: disabled ? 0.5 : 1,
  };
  const thumbStyle: CSSProperties = {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: C.surfaceSolid,
    position: "absolute",
    top: 2,
    left: value ? 20 : 2,
    transition: "left 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
    border: `1px solid ${C.border}`,
    boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
  };
  return (
    <button
      type="button"
      style={{ ...trackStyle, border: "none", padding: 0 }}
      onClick={() => !disabled && onChange(!value)}
      role="switch"
      aria-checked={value}
      disabled={disabled}
    >
      <div style={thumbStyle} />
    </button>
  );
}

// ── Section Title (uppercase label) ──
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 11,
      fontWeight: 600,
      color: C.muted,
      letterSpacing: 1,
      marginBottom: 8,
      marginLeft: 4,
      textTransform: "uppercase",
    }}>
      {children}
    </div>
  );
}

// ── Card wrapper ──
function SCard({ children, style }: { children: React.ReactNode; style?: CSSProperties }) {
  return (
    <div style={{
      backgroundColor: C.surfaceSolid,
      borderRadius: 16,
      border: `1px solid ${C.border}`,
      overflow: "hidden",
      ...style,
    }}>
      {children}
    </div>
  );
}

// ── Row (generic) ──
function Row({ icon, label, value, chevron, danger, onClick, right, style }: {
  icon?: React.ReactNode;
  label: string;
  value?: string;
  chevron?: boolean;
  danger?: boolean;
  onClick?: () => void;
  right?: React.ReactNode;
  style?: CSSProperties;
}) {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!onClick) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <div
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      style={{
        minHeight: 52,
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        cursor: onClick ? "pointer" : "default",
        transition: "background-color 0.15s ease",
        ...style,
      }}
      onMouseEnter={(e) => {
        if (onClick) (e.currentTarget as HTMLDivElement).style.backgroundColor = C.surface;
      }}
      onMouseLeave={(e) => {
        if (onClick) (e.currentTarget as HTMLDivElement).style.backgroundColor = "transparent";
      }}
    >
      {icon && (
        <div style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: danger ? C.dangerBg : C.surface,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
          flexShrink: 0,
        }}>
          {icon}
        </div>
      )}
      <span style={{ fontSize: 15, color: danger ? C.danger : C.text, flex: 1, fontWeight: 400 }}>{label}</span>
      {value && <span style={{ fontSize: 13, color: C.muted, marginRight: chevron ? 6 : 0 }}>{value}</span>}
      {right}
      {chevron && <IconChevron />}
    </div>
  );
}

// ── Toggle Row ──
function ToggleRow({ icon, label, value, onChange, disabled }: {
  icon?: React.ReactNode;
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div style={{
      minHeight: 52,
      padding: "14px 16px",
      display: "flex",
      alignItems: "center",
    }}>
      {icon && (
        <div style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: C.surface,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
          flexShrink: 0,
        }}>
          {icon}
        </div>
      )}
      <span style={{ fontSize: 15, color: C.text, flex: 1, fontWeight: 400 }}>{label}</span>
      <Toggle value={value} onChange={onChange} disabled={disabled} />
    </div>
  );
}

// ── Divider (indented past icon) ──
function Divider() {
  return <div style={{ height: 0.5, backgroundColor: C.border, marginLeft: 60 }} />;
}

// ── Badge ──
function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      fontSize: 10,
      fontWeight: 600,
      color: C.muted,
      backgroundColor: C.surface,
      padding: "2px 8px",
      borderRadius: 6,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    }}>
      {children}
    </span>
  );
}

// ── Inline Toast ──
function InlineToast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div style={{
      position: "fixed",
      bottom: 32,
      left: "50%",
      transform: `translateX(-50%) translateY(${visible ? "0" : "20px"})`,
      opacity: visible ? 1 : 0,
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      backgroundColor: C.surfaceSolid,
      border: `1px solid ${C.border}`,
      borderRadius: 12,
      padding: "10px 20px",
      fontSize: 13,
      fontWeight: 500,
      color: C.text,
      zIndex: 10000,
      pointerEvents: "none",
      boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
    }}>
      {message}
    </div>
  );
}

// ── Modal Wrapper ──
function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      onKeyDown={(e) => {
        if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " " || e.key === "Escape")) {
          e.preventDefault();
          onClose();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label="Cerrar modal"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        backgroundColor: "color-mix(in srgb, var(--overlay) 70%, transparent)",
        display: "flex",
        flexDirection: "column",
      }}
      className="md:items-center md:justify-center md:p-4"
    >
      <div
        style={{
          backgroundColor: C.bg,
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
        }}
        className="flex-1 md:flex-none md:w-full md:max-w-[440px] md:rounded-2xl md:border md:border-border md:max-h-[80vh]"
      >
        {children}
      </div>
    </div>
  );
}

// ── Theme option button ──
function ThemeOption({ label, icon, active, onClick }: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        padding: "12px 8px",
        borderRadius: 12,
        border: active ? `2px solid ${C.accent}` : `1px solid ${C.border}`,
        backgroundColor: active ? "color-mix(in srgb, var(--accent) 12%, transparent)" : "transparent",
        cursor: "pointer",
        transition: "all 0.2s ease",
      }}
    >
      {icon}
      <span style={{ fontSize: 12, fontWeight: active ? 600 : 400, color: active ? C.accent : C.muted }}>{label}</span>
    </button>
  );
}


// ════════════════════════════════════════════
// ═══════════════ MAIN PAGE ═════════════════
// ════════════════════════════════════════════
export default function ConfigPage() {
  const { session, status, logout } = useAuth();
  const token = session?.accessToken;
  const router = useRouter();
  const queryClient = useQueryClient();

  // ── Mobile section nav ──
  const [mobileSection, setMobileSection] = useState<ConfigSection | null>(null);

  // ── Desktop active section ──
  const [activeSection, setActiveSection] = useState<ConfigSection>("perfil");

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
  const [privacyProfile, setPrivacyProfile] = useState(true);
  const [privacyElo, setPrivacyElo] = useState(true);
  const [privacySearch, setPrivacySearch] = useState(true);
  const [privacyMessages, setPrivacyMessages] = useState(true);

  // ── Theme ──
  const { theme, setTheme: setAppTheme } = useTheme();
  const selectedTheme: "dark" | "light" | "system" =
    theme === "dark" || theme === "light" || theme === "system" ? theme : "system";

  // ── Toast ──
  const [toastMsg, setToastMsg] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToastVisible(false), 2000);
  }, []);

  // ── Section definitions ──
  const SECTIONS: SectionDef[] = [
    { key: "perfil", label: "Perfil", icon: <IconPerson size={18} /> },
    { key: "cuenta", label: "Cuenta", icon: <IconKey size={18} /> },
    { key: "notificaciones", label: "Notificaciones", icon: <IconBell size={18} /> },
    { key: "privacidad", label: "Privacidad", icon: <IconShield size={18} /> },
    { key: "apariencia", label: "Apariencia", icon: <IconPalette size={18} /> },
    { key: "info", label: "Informacion", icon: <IconInfo size={18} /> },
  ];

  // ── Queries ──
  const { data: notifPrefs } = useQuery({
    queryKey: ["notificationPreferences"],
    queryFn: () => getNotificationPreferences(token!),
    enabled: !!token,
  });

  const updatePrefsMutation = useMutation({
    mutationFn: (entry: { category: string; channel: string; enabled: boolean }) =>
      batchUpdateNotificationPreferences([entry], token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificationPreferences"] });
    },
  });

  // Map API category/channel matrix → flat UI booleans
  useEffect(() => {
    if (!notifPrefs) return;
    const raw = (notifPrefs as Record<string, unknown>)?.data ?? (notifPrefs as Record<string, unknown>)?.preferences ?? notifPrefs;
    const matrix = raw as Record<string, Record<string, boolean>>;
    if (!matrix || typeof matrix !== "object") return;
    const mapped: Partial<NotificationPreferences> = {};
    for (const [key, mapping] of Object.entries(NOTIF_MAP)) {
      const cat = matrix[mapping.category];
      if (cat && typeof cat === "object") {
        mapped[key as keyof NotificationPreferences] = cat[mapping.channel] ?? true;
      }
    }
    setLocalNotifPrefs((prev) => ({ ...prev, ...mapped }));
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
      }).catch((error: unknown) => {
        console.warn("No se pudo cargar perfil de usuario", error);
      });
    }
  }, [session?.username]);

  const handleToggleNotif = (key: keyof NotificationPreferences, val: boolean) => {
    setLocalNotifPrefs((prev) => ({ ...prev, [key]: val }));
    const mapping = NOTIF_MAP[key];
    updatePrefsMutation.mutate({ category: mapping.category, channel: mapping.channel, enabled: val });
    showToast("Preferencia guardada");
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
        showToast("Avatar actualizado");
      }
    } catch (error: unknown) {
      console.error("Error al actualizar avatar", error);
      showToast("No se pudo actualizar el avatar");
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
      showToast("Perfil actualizado");
    } catch (error: unknown) {
      console.error("Error al guardar perfil", error);
      showToast("No se pudo actualizar el perfil");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError("");
    setPasswordSuccess("");
    if (newPassword !== confirmPassword) {
      setPasswordError("Las contrasenas no coinciden");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("Minimo 8 caracteres");
      return;
    }
    setIsChangingPassword(true);
    try {
      await changePassword(currentPassword, newPassword, token!);
      setPasswordSuccess("Contrasena actualizada");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: unknown) {
      console.error("Error al cambiar contrasena", error);
      setPasswordError("Error al cambiar contrasena");
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
        <span style={{ fontSize: 18, fontWeight: 700, color: C.text }}>Inicia sesion</span>
        <span style={{ fontSize: 14, color: C.muted }}>Debes iniciar sesion para acceder a ajustes.</span>
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

  // ══════════════════════════════════════════════
  // ═══════════ SECTION CONTENT BLOCKS ══════════
  // ══════════════════════════════════════════════

  const sectionPerfil = (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SectionTitle>Perfil</SectionTitle>

      {/* Avatar */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 4 }}>
        <div style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            style={{
              width: 88,
              height: 88,
              borderRadius: 44,
              backgroundColor: C.surface,
              backgroundImage: avatarUrl ? `url(${avatarUrl})` : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: `2px solid ${C.border}`,
              transition: "opacity 0.2s",
              opacity: isUploadingAvatar ? 0.5 : 1,
              padding: 0,
            }}
            aria-label="Cambiar avatar"
            disabled={isUploadingAvatar}
          >
            {!avatarUrl && <IconPerson size={32} color={C.muted} />}
          </button>
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: C.accent,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              border: `2px solid ${C.bg}`,
              padding: 0,
            }}
            aria-label="Abrir selector de avatar"
            disabled={isUploadingAvatar}
          >
            <IconCamera size={14} />
          </button>
          <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: "none" }} />
        </div>
      </div>

      {/* Profile info card */}
      <SCard>
        <Row
          icon={<IconPerson size={16} />}
          label="Nombre"
          value={profileName || "Sin nombre"}
          chevron
          onClick={() => setEditModalOpen(true)}
        />
        <Divider />
        <Row
          icon={<IconEdit size={16} />}
          label="Bio"
          value={profileBio ? (profileBio.length > 24 ? profileBio.slice(0, 24) + "..." : profileBio) : "Sin bio"}
          chevron
          onClick={() => setEditModalOpen(true)}
        />
        <Divider />
        <Row
          icon={<IconGlobe size={16} />}
          label="Ubicacion"
          value={[profileCity, profileCountry].filter(Boolean).join(", ") || "Sin ubicacion"}
          chevron
          onClick={() => setEditModalOpen(true)}
        />
        <Divider />
        <Row
          icon={<IconGamepad size={16} />}
          label="Juegos"
          value="Configurar"
          chevron
          onClick={() => setEditModalOpen(true)}
        />
      </SCard>
    </div>
  );

  const sectionCuenta = (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SectionTitle>Cuenta</SectionTitle>

      <SCard>
        <Row icon={<IconMail size={16} />} label="Email" value={session?.email || "---"} />
        <Divider />
        <Row icon={<IconAt size={16} />} label="Usuario" value={session?.username || "---"} />
        <Divider />
        <Row
          icon={<IconLock size={16} />}
          label="Cambiar contrasena"
          chevron
          onClick={() => setPasswordModalOpen(true)}
        />
      </SCard>

      <SectionTitle>Cuentas vinculadas</SectionTitle>
      <SCard>
        <Row
          icon={<IconDiscord size={16} />}
          label="Discord"
          right={<Badge>Proximamente</Badge>}
        />
        <Divider />
        <Row
          icon={<IconGoogle size={16} />}
          label="Google"
          right={<Badge>Proximamente</Badge>}
        />
      </SCard>
    </div>
  );

  const sectionNotificaciones = (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SectionTitle>Torneos</SectionTitle>
      <SCard>
        <ToggleRow
          label="Actualizaciones de torneos"
          value={localNotifPrefs.tournament_updates}
          onChange={(v) => handleToggleNotif("tournament_updates", v)}
          disabled={updatePrefsMutation.isPending}
        />
        <Divider />
        <ToggleRow
          label="Recordatorios de partidas"
          value={localNotifPrefs.match_reminders}
          onChange={(v) => handleToggleNotif("match_reminders", v)}
          disabled={updatePrefsMutation.isPending}
        />
      </SCard>

      <SectionTitle>Social</SectionTitle>
      <SCard>
        <ToggleRow
          label="Interacciones sociales"
          value={localNotifPrefs.social_interactions}
          onChange={(v) => handleToggleNotif("social_interactions", v)}
          disabled={updatePrefsMutation.isPending}
        />
        <Divider />
        <ToggleRow
          label="Actividad del clan"
          value={localNotifPrefs.clan_activity}
          onChange={(v) => handleToggleNotif("clan_activity", v)}
          disabled={updatePrefsMutation.isPending}
        />
      </SCard>

      <SectionTitle>Marketplace</SectionTitle>
      <SCard>
        <ToggleRow
          label="Ofertas"
          value={localNotifPrefs.marketplace_offers}
          onChange={(v) => handleToggleNotif("marketplace_offers", v)}
          disabled={updatePrefsMutation.isPending}
        />
        <Divider />
        <ToggleRow
          label="Alertas de precios"
          value={localNotifPrefs.price_alerts}
          onChange={(v) => handleToggleNotif("price_alerts", v)}
          disabled={updatePrefsMutation.isPending}
        />
      </SCard>

      <SectionTitle>Sistema</SectionTitle>
      <SCard>
        <ToggleRow
          label="Anuncios del sistema"
          value={localNotifPrefs.system_announcements}
          onChange={(v) => handleToggleNotif("system_announcements", v)}
          disabled={updatePrefsMutation.isPending}
        />
      </SCard>
    </div>
  );

  const sectionPrivacidad = (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SectionTitle>Privacidad</SectionTitle>
      <SCard>
        <ToggleRow
          icon={<IconPerson size={16} />}
          label="Perfil publico"
          value={privacyProfile}
          onChange={setPrivacyProfile}
        />
        <Divider />
        <ToggleRow
          icon={<IconShield size={16} />}
          label="ELO visible"
          value={privacyElo}
          onChange={setPrivacyElo}
        />
        <Divider />
        <ToggleRow
          label="Visible en busquedas"
          value={privacySearch}
          onChange={setPrivacySearch}
        />
        <Divider />
        <ToggleRow
          label="Permitir mensajes"
          value={privacyMessages}
          onChange={setPrivacyMessages}
        />
      </SCard>
    </div>
  );

  const sectionApariencia = (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SectionTitle>Tema</SectionTitle>
      <SCard style={{ padding: 16 }}>
        <div style={{ display: "flex", gap: 10 }}>
          <ThemeOption
            label="Oscuro"
            icon={<IconMoon size={20} color={selectedTheme === "dark" ? C.accent : C.muted} />}
            active={selectedTheme === "dark"}
            onClick={() => setAppTheme("dark")}
          />
          <ThemeOption
            label="Claro"
            icon={<IconSun size={20} color={selectedTheme === "light" ? C.accent : C.muted} />}
            active={selectedTheme === "light"}
            onClick={() => setAppTheme("light")}
          />
          <ThemeOption
            label="Sistema"
            icon={<IconMonitor size={20} color={selectedTheme === "system" ? C.accent : C.muted} />}
            active={selectedTheme === "system"}
            onClick={() => setAppTheme("system")}
          />
        </div>
      </SCard>

      <SectionTitle>Idioma</SectionTitle>
      <SCard>
        <Row
          icon={<IconGlobe size={16} />}
          label="Idioma"
          value="Espanol"
        />
      </SCard>
    </div>
  );

  const sectionInfo = (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SectionTitle>Informacion</SectionTitle>
      <SCard>
        <Link href="/terminos" style={{ textDecoration: "none" }}>
          <Row icon={<IconDoc size={16} />} label="Terminos de servicio" right={<IconExternalLink />} />
        </Link>
        <Divider />
        <Link href="/privacidad" style={{ textDecoration: "none" }}>
          <Row icon={<IconShield size={16} />} label="Politica de privacidad" right={<IconExternalLink />} />
        </Link>
      </SCard>

      <SCard>
        <Row icon={<IconInfo size={16} />} label="Version" value="v1.0.0" />
      </SCard>
    </div>
  );

  const sectionContentMap: Record<ConfigSection, React.ReactNode> = {
    perfil: sectionPerfil,
    cuenta: sectionCuenta,
    notificaciones: sectionNotificaciones,
    privacidad: sectionPrivacidad,
    apariencia: sectionApariencia,
    info: sectionInfo,
  };

  const getSectionLabel = (key: ConfigSection) => SECTIONS.find((s) => s.key === key)?.label ?? "";

  return (
    <div style={{ backgroundColor: C.bg, minHeight: "100vh" }}>

      {/* ══════════ MOBILE ══════════ */}
      <div className="md:hidden">
        {mobileSection === null ? (
          /* ── Section list (iOS Settings style) ── */
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px" }}>
              <button
                onClick={() => router.back()}
                style={{
                  width: 36, height: 36, borderRadius: 18, backgroundColor: C.surfaceSolid,
                  border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                }}
              >
                <IconBack />
              </button>
              <span style={{ fontSize: 20, fontWeight: 800, color: C.text }}>Ajustes</span>
            </div>

            <div style={{ padding: "8px 16px", paddingBottom: 80 }}>
              {/* Avatar + Name at top */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 24, gap: 8 }}>
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 36,
                    backgroundColor: C.surface,
                    backgroundImage: avatarUrl ? `url(${avatarUrl})` : undefined,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: `2px solid ${C.border}`,
                  }}
                >
                  {!avatarUrl && <IconPerson size={28} color={C.muted} />}
                </div>
                <span style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{profileName || session?.username || "Usuario"}</span>
                {session?.email && <span style={{ fontSize: 13, color: C.muted }}>{session.email}</span>}
              </div>

              {/* Sections card */}
              <SCard>
                {SECTIONS.map((section, i) => (
                  <div key={section.key}>
                    {i > 0 && <Divider />}
                    <Row
                      icon={section.icon}
                      label={section.label}
                      chevron
                      onClick={() => setMobileSection(section.key)}
                    />
                  </div>
                ))}
              </SCard>

              {/* Logout */}
              <div style={{ marginTop: 24 }}>
                <SCard>
                  <Row icon={<IconLogout />} label="Cerrar sesion" danger onClick={handleLogout} />
                </SCard>
              </div>

              {/* Delete account + version */}
              <div style={{ marginTop: 24 }}>
                <SCard>
                  <Row icon={<IconTrash />} label="Eliminar cuenta" danger onClick={() => {}} />
                </SCard>
              </div>

              <div style={{ marginTop: 16, textAlign: "center", paddingBottom: 16 }}>
                <span style={{ color: C.versionText, fontSize: 12 }}>Rankeao v1.0.0</span>
              </div>
            </div>
          </>
        ) : (
          /* ── Section detail view ── */
          <>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 16px",
              borderBottom: `1px solid ${C.border}`,
            }}>
              <button
                onClick={() => setMobileSection(null)}
                style={{
                  width: 36, height: 36, borderRadius: 18, backgroundColor: C.surfaceSolid,
                  border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                }}
              >
                <IconBack />
              </button>
              <span style={{ fontSize: 18, fontWeight: 700, color: C.text }}>{getSectionLabel(mobileSection)}</span>
            </div>

            <div style={{ padding: "20px 16px", paddingBottom: 80 }}>
              {sectionContentMap[mobileSection]}
            </div>
          </>
        )}
      </div>

      {/* ══════════ DESKTOP ══════════ */}
      <div
        className="hidden md:flex"
        style={{
          width: "100%",
          padding: "0 24px",
          gap: 0,
          minHeight: "calc(100vh - 64px)",
        }}
      >
        {/* Sidebar */}
        <div style={{
          width: 260,
          flexShrink: 0,
          padding: "28px 16px 28px 0",
          borderRight: `1px solid ${C.border}`,
          position: "sticky",
          top: 64,
          height: "calc(100vh - 64px)",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 20 }}>
            Configuración
          </h1>

          <nav style={{ display: "flex", flexDirection: "column", gap: 0, flex: 1 }}>
            {SECTIONS.map((section) => {
              const isActive = activeSection === section.key;
              return (
                <button
                  key={section.key}
                  onClick={() => setActiveSection(section.key)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "11px 12px",
                    borderRadius: 10,
                    border: "none",
                    cursor: "pointer",
                    backgroundColor: isActive ? "color-mix(in srgb, var(--accent) 12%, transparent)" : "transparent",
                    color: isActive ? C.text : C.muted,
                    fontSize: 14,
                    fontWeight: isActive ? 600 : 400,
                    textAlign: "left",
                    width: "100%",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", width: 20, justifyContent: "center" }}>
                    {section.icon}
                  </span>
                  {section.label}
                </button>
              );
            })}
          </nav>

          <div style={{ paddingTop: 8 }}>
            <button
              onClick={handleLogout}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "11px 12px",
                borderRadius: 10,
                border: "none",
                cursor: "pointer",
                backgroundColor: "transparent",
                color: C.danger,
                fontSize: 14,
                fontWeight: 400,
                textAlign: "left",
                width: "100%",
              }}
            >
              <IconLogout size={18} />
              Cerrar sesion
            </button>
            <p style={{ color: C.versionText, fontSize: 11, margin: "16px 0 0 12px" }}>Rankeao v1.0.0</p>
          </div>
        </div>

        {/* Content panel */}
        <div style={{ flex: 1, minWidth: 0, padding: "28px 0 64px 40px", overflowY: "auto" }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 24 }}>
            {getSectionLabel(activeSection)}
          </h2>
          {sectionContentMap[activeSection]}
        </div>
      </div>

      {/* ══════════ EDIT PROFILE MODAL ══════════ */}
      <Modal open={editModalOpen} onClose={() => setEditModalOpen(false)}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 16px",
          borderBottom: `1px solid ${C.border}`,
        }}>
          <button
            onClick={() => setEditModalOpen(false)}
            style={{
              width: 36, height: 36, borderRadius: 18, backgroundColor: C.surfaceSolid,
              border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
            }}
          >
            <IconClose />
          </button>
          <span style={{ fontSize: 16, fontWeight: 700, color: C.text, flex: 1 }}>Editar perfil</span>
          <button
            onClick={handleSaveProfile}
            disabled={isSavingProfile}
            style={{
              backgroundColor: C.accent,
              border: "none",
              borderRadius: 10,
              padding: "8px 20px",
              cursor: "pointer",
              opacity: isSavingProfile ? 0.5 : 1,
              fontSize: 13,
              fontWeight: 700,
              color: "var(--accent-foreground)",
            }}
          >
            {isSavingProfile ? "..." : "Guardar"}
          </button>
        </div>

        <div style={{ padding: "20px 16px", flex: 1 }}>
          <SectionTitle>Nombre</SectionTitle>
          <SCard style={{ marginBottom: 16 }}>
            <input
              type="text"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              placeholder="Tu nombre"
              style={inputStyle}
            />
          </SCard>

          <SectionTitle>Bio</SectionTitle>
          <SCard style={{ marginBottom: 16 }}>
            <textarea
              value={profileBio}
              onChange={(e) => setProfileBio(e.target.value)}
              placeholder="Algo sobre ti..."
              rows={3}
              style={{ ...inputStyle, resize: "none" }}
            />
          </SCard>

          <SectionTitle>Ciudad</SectionTitle>
          <SCard style={{ marginBottom: 16 }}>
            <input
              type="text"
              value={profileCity}
              onChange={(e) => setProfileCity(e.target.value)}
              placeholder="Tu ciudad"
              style={inputStyle}
            />
          </SCard>

          <SectionTitle>Pais</SectionTitle>
          <SCard style={{ marginBottom: 16 }}>
            <input
              type="text"
              value={profileCountry}
              onChange={(e) => setProfileCountry(e.target.value)}
              placeholder="Tu pais"
              style={inputStyle}
            />
          </SCard>
        </div>
      </Modal>

      {/* ══════════ CHANGE PASSWORD MODAL ══════════ */}
      <Modal open={passwordModalOpen} onClose={() => setPasswordModalOpen(false)}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 16px",
          borderBottom: `1px solid ${C.border}`,
        }}>
          <button
            onClick={() => { setPasswordModalOpen(false); setPasswordError(""); setPasswordSuccess(""); }}
            style={{
              width: 36, height: 36, borderRadius: 18, backgroundColor: C.surfaceSolid,
              border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
            }}
          >
            <IconClose />
          </button>
          <span style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Cambiar contrasena</span>
        </div>

        <div style={{ padding: "20px 16px", flex: 1 }}>
          {passwordError && (
            <div style={{ backgroundColor: C.dangerBg, padding: "10px 16px", borderRadius: 12, marginBottom: 16 }}>
              <span style={{ color: C.danger, fontSize: 13 }}>{passwordError}</span>
            </div>
          )}
          {passwordSuccess && (
            <div style={{ backgroundColor: "color-mix(in srgb, var(--success) 12%, transparent)", padding: "10px 16px", borderRadius: 12, marginBottom: 16 }}>
              <span style={{ color: "var(--success)", fontSize: 13 }}>{passwordSuccess}</span>
            </div>
          )}

          <SectionTitle>Contrasena actual</SectionTitle>
          <SCard style={{ marginBottom: 16 }}>
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="--------" style={inputStyle} />
          </SCard>

          <SectionTitle>Nueva contrasena</SectionTitle>
          <SCard style={{ marginBottom: 16 }}>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="--------" style={inputStyle} />
          </SCard>

          <SectionTitle>Confirmar contrasena</SectionTitle>
          <SCard style={{ marginBottom: 24 }}>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="--------" style={inputStyle} />
          </SCard>

          <button
            onClick={handleChangePassword}
            disabled={isChangingPassword}
            style={{
              width: "100%",
              backgroundColor: C.accent,
              border: "none",
              borderRadius: 12,
              padding: "14px 0",
              cursor: "pointer",
              opacity: isChangingPassword ? 0.5 : 1,
              fontSize: 14,
              fontWeight: 700,
              color: "var(--accent-foreground)",
              textAlign: "center",
            }}
          >
            {isChangingPassword ? "Guardando..." : "Guardar contrasena"}
          </button>
        </div>
      </Modal>

      {/* ══════════ TOAST ══════════ */}
      <InlineToast message={toastMsg} visible={toastVisible} />
    </div>
  );
}
