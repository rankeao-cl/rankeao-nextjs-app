"use client";

import { useState } from "react";
import { toast } from "@heroui/react";
import { Persons, ArrowRightFromSquare, BellSlash, Bell, Person } from "@gravity-ui/icons";
import { muteChannel, unmuteChannel, leaveChannel } from "@/lib/api/chat";
import { useAuth } from "@/context/AuthContext";
import type { Channel } from "@/lib/types/chat";
import { useRef } from "react";

interface Props {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    channel: Channel | null;
    onChannelLeft?: () => void;
    onChannelUpdated?: (channel: Channel) => void;
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

export default function ChatSettingsModal({ isOpen, onOpenChange, channel, onChannelLeft, onChannelUpdated }: Props) {
    const { session } = useAuth();
    const token = session?.accessToken;
    const [isMuted, setIsMuted] = useState(channel?.is_muted ?? false);
    const [isTogglingMute, setIsTogglingMute] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
    const overlayRef = useRef<HTMLDivElement>(null);

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
                toast.success("Notificaciones activadas");
            } else {
                await muteChannel(channel.id, token);
                setIsMuted(true);
                toast.success("Chat silenciado");
            }
            if (onChannelUpdated) {
                onChannelUpdated({ ...channel, is_muted: !isMuted });
            }
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
            toast.success("Saliste del chat");
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
                position: "fixed",
                inset: 0,
                zIndex: 9999,
                display: "flex",
                justifyContent: "center",
                background: "rgba(0,0,0,0.6)",
            }}
            className="items-end md:items-center md:p-4"
        >
            <div
                style={{
                    width: "100%",
                    maxWidth: 440,
                    background: C.bg,
                    maxHeight: "85vh",
                    overflowY: "auto",
                    borderTop: `0.5px solid ${C.border}`,
                }}
                className="rounded-t-3xl md:rounded-2xl md:border md:border-[rgba(255,255,255,0.06)]"
            >
                {/* Handle */}
                <div style={{ display: "flex", justifyContent: "center", marginTop: 12, marginBottom: 16 }}>
                    <div style={{
                        width: 36, height: 4, borderRadius: 2,
                        background: C.handle,
                    }} />
                </div>

                {/* Header info */}
                <div style={{ textAlign: "center", paddingBottom: 16, paddingLeft: 20, paddingRight: 20 }}>
                    <div style={{
                        width: 56, height: 56, borderRadius: 28, margin: "0 auto 12px",
                        background: C.surface,
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                        {channel.type === "DM" && otherUser ? (
                            otherUser.avatar_url ? (
                                <img
                                    src={otherUser.avatar_url}
                                    alt={otherUser.username}
                                    style={{ width: 56, height: 56, borderRadius: 28, objectFit: "cover" }}
                                />
                            ) : (
                                <Person style={{ width: 24, height: 24, color: C.muted }} />
                            )
                        ) : (
                            <Persons style={{ width: 24, height: 24, color: C.muted }} />
                        )}
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>{displayName}</div>
                    <div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>
                        {channel.type === "DM" ? "Mensaje directo" : `${members.length} miembros`}
                    </div>
                </div>

                {/* NOTIFICATIONS section */}
                <div style={{ padding: "0 20px" }}>
                    <div style={{
                        fontSize: 11, fontWeight: 700, color: C.muted,
                        textTransform: "uppercase", letterSpacing: 1.2,
                        marginTop: 16, marginBottom: 8,
                    }}>
                        Preferencias
                    </div>
                    <div style={{
                        background: C.surface, borderRadius: 16,
                        border: `1px solid ${C.border}`,
                        overflow: "hidden",
                    }}>
                        <div style={{
                            display: "flex", alignItems: "center", gap: 12,
                            padding: "14px 16px",
                        }}>
                            {isMuted
                                ? <BellSlash style={{ width: 20, height: 20, color: C.muted, flexShrink: 0 }} />
                                : <Bell style={{ width: 20, height: 20, color: C.accent, flexShrink: 0 }} />
                            }
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 14, color: C.text }}>Notificaciones</div>
                                <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>
                                    {isMuted ? "Silenciado" : "Activas"}
                                </div>
                            </div>
                            <label style={{
                                position: "relative", display: "inline-block",
                                width: 44, height: 26, flexShrink: 0,
                            }}>
                                <input
                                    type="checkbox"
                                    checked={!isMuted}
                                    onChange={handleToggleMute}
                                    disabled={isTogglingMute}
                                    style={{
                                        opacity: 0, width: 0, height: 0,
                                        position: "absolute",
                                    }}
                                />
                                <span style={{
                                    position: "absolute", cursor: isTogglingMute ? "not-allowed" : "pointer",
                                    inset: 0, borderRadius: 999,
                                    background: isMuted ? "rgba(255,255,255,0.1)" : C.accent,
                                    transition: "background 0.2s",
                                }} />
                                <span style={{
                                    position: "absolute",
                                    width: 20, height: 20, borderRadius: 10,
                                    background: "#FFFFFF",
                                    left: isMuted ? 3 : 21,
                                    top: 3,
                                    transition: "left 0.2s",
                                    boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                                }} />
                            </label>
                        </div>
                    </div>
                </div>

                {/* MEMBERS section */}
                {members.length > 0 && (
                    <div style={{ padding: "0 20px" }}>
                        <div style={{
                            fontSize: 11, fontWeight: 700, color: C.muted,
                            textTransform: "uppercase", letterSpacing: 1.2,
                            marginTop: 16, marginBottom: 8,
                        }}>
                            Miembros ({members.length})
                        </div>
                        <div style={{
                            background: C.surface, borderRadius: 16,
                            border: `1px solid ${C.border}`,
                            overflow: "hidden",
                        }}>
                            {members.map((member, idx) => {
                                const isMe = member.username === myUsername;
                                return (
                                    <div key={member.user_id}>
                                        <div style={{
                                            display: "flex", alignItems: "center", gap: 12,
                                            padding: "14px 16px",
                                        }}>
                                            {/* Avatar */}
                                            <div style={{
                                                position: "relative", flexShrink: 0,
                                            }}>
                                                <div style={{
                                                    width: 36, height: 36, borderRadius: 18,
                                                    background: C.surfaceLight,
                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                    overflow: "hidden",
                                                }}>
                                                    {member.avatar_url ? (
                                                        <img
                                                            src={member.avatar_url}
                                                            alt={member.username}
                                                            style={{ width: 36, height: 36, objectFit: "cover" }}
                                                        />
                                                    ) : (
                                                        <span style={{ fontSize: 12, fontWeight: 700, color: C.muted }}>
                                                            {member.username?.slice(0, 2).toUpperCase()}
                                                        </span>
                                                    )}
                                                </div>
                                                {member.is_online && (
                                                    <span style={{
                                                        position: "absolute", bottom: 0, right: 0,
                                                        width: 10, height: 10, borderRadius: 5,
                                                        background: "#22C55E",
                                                        border: `2px solid ${C.surface}`,
                                                    }} />
                                                )}
                                            </div>
                                            {/* Info */}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{
                                                    fontSize: 14, color: C.text, fontWeight: 500,
                                                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                                }}>
                                                    {member.username}
                                                    {isMe && (
                                                        <span style={{ color: C.accent, marginLeft: 4, fontSize: 12 }}>
                                                            (tú)
                                                        </span>
                                                    )}
                                                </div>
                                                {member.role && member.role !== "member" && (
                                                    <div style={{
                                                        fontSize: 10, color: C.accent,
                                                        fontWeight: 600, textTransform: "uppercase",
                                                    }}>
                                                        {member.role}
                                                    </div>
                                                )}
                                            </div>
                                            {/* Online status */}
                                            <span style={{
                                                fontSize: 10, fontWeight: 500,
                                                color: member.is_online ? "#22C55E" : C.muted,
                                            }}>
                                                {member.is_online ? "online" : "offline"}
                                            </span>
                                        </div>
                                        {/* Divider */}
                                        {idx < members.length - 1 && (
                                            <div style={{
                                                height: 0.5, background: C.border,
                                                marginLeft: 64,
                                            }} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Leave channel */}
                {(isGroup || isCommunity) && (
                    <div style={{ padding: "0 20px", marginTop: 16 }}>
                        <div style={{
                            fontSize: 11, fontWeight: 700, color: C.muted,
                            textTransform: "uppercase", letterSpacing: 1.2,
                            marginBottom: 8,
                        }}>
                            Zona de peligro
                        </div>
                        <div style={{
                            background: C.surface, borderRadius: 16,
                            border: `1px solid ${C.border}`,
                            overflow: "hidden",
                        }}>
                            {showLeaveConfirm ? (
                                <div style={{ padding: 16 }}>
                                    <div style={{ fontSize: 14, color: C.danger, fontWeight: 500, marginBottom: 12 }}>
                                        ¿Seguro que quieres salir de este {isGroup ? "grupo" : "canal"}? No podrás ver los mensajes anteriores.
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
                        </div>
                    </div>
                )}

                {/* Bottom spacing */}
                <div style={{ height: 32 }} />
            </div>
        </div>
    );
}
