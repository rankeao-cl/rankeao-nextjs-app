"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "@heroui/react";
import { Persons, ArrowRightFromSquare, BellSlash, Bell, Person } from "@gravity-ui/icons";
import { muteChannel, unmuteChannel, leaveChannel } from "@/lib/api/chat";
import { useAuth } from "@/context/AuthContext";
import type { Channel } from "@/lib/types/chat";

interface Props {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    channel: Channel | null;
    onChannelLeft?: () => void;
    onChannelUpdated?: (channel: Channel) => void;
    chatSettings?: ChatSettings;
    onChatSettingsChange?: (s: ChatSettings) => void;
}

const C = {
    bg: "#000000",
    surface: "#1A1A1E",
    surfaceLight: "#222226",
    border: "rgba(255,255,255,0.06)",
    text: "#F2F2F2",
    muted: "#888891",
    accent: "#3B82F6",
    danger: "#EF4444",
    handle: "rgba(255,255,255,0.15)",
} as const;

// ── Chat settings types ──

const FONT_SIZES = [
    { key: "small", label: "Pequeno", size: 13 },
    { key: "medium", label: "Normal", size: 15 },
    { key: "large", label: "Grande", size: 17 },
    { key: "xlarge", label: "Muy grande", size: 20 },
];

const BUBBLE_THEMES = [
    { key: "default", label: "Oscuro", color: "#2C2C30" },
    { key: "green", label: "Verde", color: "#25D366" },
];

export type ChatSettings = {
    fontSize: string;
    showTimestamps: boolean;
    compactMode: boolean;
    showAvatars: boolean;
    enterToSend: boolean;
    theme: string;
};

export const DEFAULT_CHAT_SETTINGS: ChatSettings = {
    fontSize: "medium",
    showTimestamps: true,
    compactMode: false,
    showAvatars: true,
    enterToSend: true,
    theme: "default",
};

// ── Toggle component ──

function Toggle({ value, onChange, disabled }: { value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
    return (
        <label style={{ position: "relative", display: "inline-block", width: 44, height: 26, flexShrink: 0 }}>
            <input
                type="checkbox"
                checked={value}
                onChange={() => onChange(!value)}
                disabled={disabled}
                style={{ opacity: 0, width: 0, height: 0, position: "absolute" }}
            />
            <span style={{
                position: "absolute", cursor: disabled ? "not-allowed" : "pointer",
                inset: 0, borderRadius: 999,
                background: value ? C.text : "#3a3a3c",
                transition: "background 0.2s",
            }} />
            <span style={{
                position: "absolute",
                width: 20, height: 20, borderRadius: 10,
                background: "#FFFFFF",
                left: value ? 21 : 3, top: 3,
                transition: "left 0.2s",
                boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
            }} />
        </label>
    );
}

// ── Radio button ──

function RadioButton({ selected }: { selected: boolean }) {
    return (
        <div style={{
            width: 20, height: 20, borderRadius: 10,
            border: `2px solid ${C.text}`,
            display: "flex", alignItems: "center", justifyContent: "center",
        }}>
            {selected && <div style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: C.text }} />}
        </div>
    );
}

// ── Section helpers ──

function SectionLabel({ children }: { children: string }) {
    return (
        <div style={{
            fontSize: 11, fontWeight: 700, color: C.muted,
            textTransform: "uppercase", letterSpacing: 1.2,
            marginTop: 16, marginBottom: 8, marginLeft: 4,
        }}>
            {children}
        </div>
    );
}

function Card({ children }: { children: React.ReactNode }) {
    return (
        <div style={{
            background: C.surface, borderRadius: 16,
            border: `1px solid ${C.border}`, overflow: "hidden",
        }}>
            {children}
        </div>
    );
}

function Divider() {
    return <div style={{ height: 0.5, background: C.border, marginLeft: 16 }} />;
}

export default function ChatSettingsModal({ isOpen, onOpenChange, channel, onChannelLeft, onChannelUpdated, chatSettings, onChatSettingsChange }: Props) {
    const { session } = useAuth();
    const token = session?.accessToken;
    const [isMuted, setIsMuted] = useState(channel?.is_muted ?? false);
    const [isTogglingMute, setIsTogglingMute] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
    const overlayRef = useRef<HTMLDivElement>(null);

    // Local settings state (fallback if no props)
    const [localSettings, setLocalSettings] = useState<ChatSettings>(chatSettings ?? DEFAULT_CHAT_SETTINGS);

    useEffect(() => {
        if (chatSettings) setLocalSettings(chatSettings);
    }, [chatSettings]);

    const updateSetting = (partial: Partial<ChatSettings>) => {
        const next = { ...localSettings, ...partial };
        setLocalSettings(next);
        onChatSettingsChange?.(next);
        try { localStorage.setItem("rankeao.chat.settings", JSON.stringify(next)); } catch {}
    };

    if (!channel || !isOpen) return null;

    const isGroup = channel.type === "GROUP";
    const isCommunity = channel.type === "CLAN" || channel.type === "TOURNAMENT";
    const members = channel.members ?? [];
    const myUsername = session?.username;

    let otherUser = null;
    if (channel.type === "DM" && myUsername) {
        otherUser = members.find(m => m.username !== myUsername) ?? null;
    }

    const displayName = channel.type === "DM" && otherUser
        ? otherUser.username
        : channel.name || "Canal";

    const handleToggleMute = async () => {
        if (!token || !channel) return;
        setIsTogglingMute(true);
        try {
            if (isMuted) {
                await unmuteChannel(channel.id, token);
                setIsMuted(false);
            } else {
                await muteChannel(channel.id, token);
                setIsMuted(true);
            }
            onChannelUpdated?.({ ...channel, is_muted: !isMuted });
        } catch {
            toast.danger("Error al cambiar notificaciones");
        } finally {
            setIsTogglingMute(false);
        }
    };

    const handleLeave = async () => {
        if (!token || !channel) return;
        setIsLeaving(true);
        try {
            await leaveChannel(channel.id, token);
            onOpenChange(false);
            onChannelLeft?.();
        } catch {
            toast.danger("Error al salir del chat");
        } finally {
            setIsLeaving(false);
            setShowLeaveConfirm(false);
        }
    };

    return (
        <div
            ref={overlayRef}
            onClick={(e) => { if (e.target === overlayRef.current) onOpenChange(false); }}
            style={{
                position: "fixed", inset: 0, zIndex: 9999,
                display: "flex", justifyContent: "center",
                background: "rgba(0,0,0,0.6)",
            }}
            className="items-end md:items-center md:p-4"
        >
            <div
                style={{
                    width: "100%", maxWidth: 440,
                    background: C.bg,
                    maxHeight: "85vh", overflowY: "auto",
                    borderTop: `0.5px solid ${C.border}`,
                }}
                className="rounded-t-3xl md:rounded-2xl md:border md:border-[rgba(255,255,255,0.06)]"
            >
                {/* Handle */}
                <div style={{ display: "flex", justifyContent: "center", paddingTop: 10, paddingBottom: 6 }}>
                    <div style={{ width: 36, height: 4, borderRadius: 2, background: C.handle }} />
                </div>

                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px" }}>
                    <span style={{ color: C.text, fontSize: 17, fontWeight: 700 }}>Ajustes del chat</span>
                    <button
                        onClick={() => onOpenChange(false)}
                        style={{
                            width: 32, height: 32, borderRadius: 16,
                            backgroundColor: C.surface, border: "none",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            cursor: "pointer",
                        }}
                    >
                        <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <div style={{ padding: "0 16px", paddingBottom: 32 }}>

                    {/* ── TAMAÑO DE FUENTE ── */}
                    <SectionLabel>Tamaño de fuente</SectionLabel>
                    <Card>
                        {FONT_SIZES.map((f, i) => (
                            <div key={f.key}>
                                {i > 0 && <Divider />}
                                <button
                                    onClick={() => updateSetting({ fontSize: f.key })}
                                    style={{
                                        display: "flex", alignItems: "center", gap: 12,
                                        padding: "14px 16px", width: "100%",
                                        background: "transparent", border: "none",
                                        cursor: "pointer", textAlign: "left",
                                    }}
                                >
                                    <span style={{ color: C.text, fontWeight: 600, width: 32, fontSize: f.size }}>Aa</span>
                                    <span style={{ flex: 1, color: C.text, fontSize: 14 }}>{f.label}</span>
                                    <RadioButton selected={localSettings.fontSize === f.key} />
                                </button>
                            </div>
                        ))}
                    </Card>

                    {/* ── VISUALIZACIÓN ── */}
                    <SectionLabel>Visualización</SectionLabel>
                    <Card>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px" }}>
                            <span style={{ color: C.text, fontSize: 14 }}>Mostrar timestamps</span>
                            <Toggle value={localSettings.showTimestamps} onChange={(v) => updateSetting({ showTimestamps: v })} />
                        </div>
                        <Divider />
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px" }}>
                            <span style={{ color: C.text, fontSize: 14 }}>Modo compacto</span>
                            <Toggle value={localSettings.compactMode} onChange={(v) => updateSetting({ compactMode: v })} />
                        </div>
                    </Card>

                    {/* ── MENSAJES ── */}
                    <SectionLabel>Mensajes</SectionLabel>
                    <Card>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px" }}>
                            <span style={{ color: C.text, fontSize: 14 }}>Mostrar avatares</span>
                            <Toggle value={localSettings.showAvatars} onChange={(v) => updateSetting({ showAvatars: v })} />
                        </div>
                        <Divider />
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px" }}>
                            <span style={{ color: C.text, fontSize: 14 }}>Enter para enviar</span>
                            <Toggle value={localSettings.enterToSend} onChange={(v) => updateSetting({ enterToSend: v })} />
                        </div>
                    </Card>

                    {/* ── NOTIFICACIONES ── */}
                    <SectionLabel>Preferencias</SectionLabel>
                    <Card>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px" }}>
                            {isMuted
                                ? <BellSlash style={{ width: 20, height: 20, color: C.muted, flexShrink: 0 }} />
                                : <Bell style={{ width: 20, height: 20, color: C.accent, flexShrink: 0 }} />
                            }
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 14, color: C.text }}>Notificaciones</div>
                                <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>{isMuted ? "Silenciado" : "Activas"}</div>
                            </div>
                            <Toggle value={!isMuted} onChange={handleToggleMute} disabled={isTogglingMute} />
                        </div>
                    </Card>

                    {/* ── TEMA DE BURBUJAS ── */}
                    <SectionLabel>Tema de burbujas</SectionLabel>
                    <Card>
                        <div style={{ display: "flex", justifyContent: "space-around", padding: "16px 12px" }}>
                            {BUBBLE_THEMES.map((t) => (
                                <button
                                    key={t.key}
                                    onClick={() => updateSetting({ theme: t.key })}
                                    style={{
                                        display: "flex", flexDirection: "column", alignItems: "center",
                                        gap: 8, background: "transparent", border: "none", cursor: "pointer",
                                    }}
                                >
                                    <div style={{
                                        width: 44, height: 44, borderRadius: 22,
                                        backgroundColor: t.color,
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        border: localSettings.theme === t.key ? "3px solid #FFFFFF" : "none",
                                    }}>
                                        {localSettings.theme === t.key && (
                                            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                        )}
                                    </div>
                                    <span style={{
                                        fontSize: 11, fontWeight: 500,
                                        color: localSettings.theme === t.key ? C.text : C.muted,
                                    }}>
                                        {t.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </Card>

                    {/* ── MIEMBROS ── */}
                    {members.length > 0 && (
                        <>
                            <SectionLabel>{`Miembros (${members.length})`}</SectionLabel>
                            <Card>
                                {members.map((member, idx) => {
                                    const isMe = member.username === myUsername;
                                    return (
                                        <div key={member.user_id || idx}>
                                            {idx > 0 && <Divider />}
                                            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px" }}>
                                                <div style={{ position: "relative", flexShrink: 0 }}>
                                                    <div style={{
                                                        width: 36, height: 36, borderRadius: 18,
                                                        background: C.surfaceLight,
                                                        display: "flex", alignItems: "center", justifyContent: "center",
                                                        overflow: "hidden",
                                                    }}>
                                                        {member.avatar_url ? (
                                                            <img src={member.avatar_url} alt={member.username} style={{ width: 36, height: 36, objectFit: "cover" }} />
                                                        ) : (
                                                            <span style={{ fontSize: 12, fontWeight: 700, color: C.muted }}>{member.username?.slice(0, 2).toUpperCase()}</span>
                                                        )}
                                                    </div>
                                                    {member.is_online && (
                                                        <span style={{ position: "absolute", bottom: 0, right: 0, width: 10, height: 10, borderRadius: 5, background: "#22C55E", border: `2px solid ${C.surface}` }} />
                                                    )}
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontSize: 14, color: C.text, fontWeight: 500 }}>
                                                        {member.username}
                                                        {isMe && <span style={{ color: C.accent, marginLeft: 4, fontSize: 12 }}>(tú)</span>}
                                                    </div>
                                                    {member.role && member.role !== "member" && (
                                                        <div style={{ fontSize: 10, color: C.accent, fontWeight: 600, textTransform: "uppercase" }}>{member.role}</div>
                                                    )}
                                                </div>
                                                <span style={{ fontSize: 10, fontWeight: 500, color: member.is_online ? "#22C55E" : C.muted }}>
                                                    {member.is_online ? "online" : "offline"}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </Card>
                        </>
                    )}

                    {/* ── ABANDONAR ── */}
                    {(isGroup || isCommunity) && (
                        <>
                            <SectionLabel>Zona de peligro</SectionLabel>
                            <Card>
                                {showLeaveConfirm ? (
                                    <div style={{ padding: 16 }}>
                                        <div style={{ fontSize: 14, color: C.danger, fontWeight: 500, marginBottom: 12 }}>
                                            ¿Seguro que quieres salir de este {isGroup ? "grupo" : "canal"}?
                                        </div>
                                        <div style={{ display: "flex", gap: 8 }}>
                                            <button
                                                onClick={handleLeave}
                                                disabled={isLeaving}
                                                style={{
                                                    padding: "10px 20px", borderRadius: 999,
                                                    background: C.danger, color: "#FFFFFF",
                                                    fontSize: 13, fontWeight: 700,
                                                    border: "none", cursor: isLeaving ? "not-allowed" : "pointer",
                                                    opacity: isLeaving ? 0.6 : 1,
                                                }}
                                            >
                                                {isLeaving ? "Saliendo..." : "Sí, salir"}
                                            </button>
                                            <button
                                                onClick={() => setShowLeaveConfirm(false)}
                                                style={{
                                                    padding: "10px 20px", borderRadius: 999,
                                                    background: C.surfaceLight, color: C.text,
                                                    fontSize: 13, fontWeight: 600,
                                                    border: "none", cursor: "pointer",
                                                }}
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setShowLeaveConfirm(true)}
                                        style={{
                                            display: "flex", alignItems: "center", gap: 12,
                                            padding: "14px 16px", width: "100%",
                                            background: "transparent", border: "none",
                                            cursor: "pointer", textAlign: "left",
                                        }}
                                    >
                                        <ArrowRightFromSquare style={{ width: 18, height: 18, color: C.danger }} />
                                        <span style={{ fontSize: 14, color: C.danger, fontWeight: 500 }}>
                                            Salir del {isGroup ? "grupo" : "canal"}
                                        </span>
                                    </button>
                                )}
                            </Card>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
