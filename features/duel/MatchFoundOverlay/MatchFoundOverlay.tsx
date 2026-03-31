"use client";

import Image from "next/image";

interface MatchFoundOverlayProps {
    type: "found" | "accepted";
    challengerUsername: string;
    challengerAvatarUrl?: string;
    challengedUsername: string;
    challengedAvatarUrl?: string;
    gameName?: string;
    bestOf?: number;
    isFading: boolean;
    onSkip: () => void;
}

function AvatarCircle({
    username,
    avatarUrl,
    ringColor,
    size = 80,
}: {
    username: string;
    avatarUrl?: string;
    ringColor: string;
    size?: number;
}) {
    const inner = size - 6;
    return (
        <div
            style={{
                width: size,
                height: size,
                borderRadius: size / 2,
                background: ringColor,
                padding: 3,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
            }}
        >
            <div
                style={{
                    width: inner,
                    height: inner,
                    borderRadius: inner / 2,
                    backgroundColor: "#0a0a0f",
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                {avatarUrl ? (
                    <Image
                        src={avatarUrl}
                        alt={username}
                        width={inner}
                        height={inner}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                ) : (
                    <span
                        style={{
                            fontSize: size * 0.32,
                            fontWeight: 800,
                            color: "#fff",
                        }}
                    >
                        {(username || "?").charAt(0).toUpperCase()}
                    </span>
                )}
            </div>
        </div>
    );
}

export default function MatchFoundOverlay({
    type,
    challengerUsername,
    challengerAvatarUrl,
    challengedUsername,
    challengedAvatarUrl,
    gameName,
    bestOf,
    isFading,
    onSkip,
}: MatchFoundOverlayProps) {
    const title = type === "found" ? "PARTIDA ENCONTRADA" : "PARTIDA ACEPTADA";

    return (
        <div
            onClick={onSkip}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 1000,
                background: "rgba(0,0,0,0.97)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                overflow: "hidden",
                opacity: isFading ? 0 : 1,
                transform: isFading ? "scale(1.05)" : "scale(1)",
                transition: "opacity 0.7s ease-out, transform 0.7s ease-out",
            }}
        >
            <style>{`
                @keyframes mfoSlideDown {
                    0% { opacity: 0; transform: translateY(-40px); }
                    60% { opacity: 1; transform: translateY(4px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
                @keyframes mfoSlideLeft {
                    0% { opacity: 0; transform: translateX(-80px); }
                    60% { opacity: 1; transform: translateX(4px); }
                    100% { opacity: 1; transform: translateX(0); }
                }
                @keyframes mfoSlideRight {
                    0% { opacity: 0; transform: translateX(80px); }
                    60% { opacity: 1; transform: translateX(-4px); }
                    100% { opacity: 1; transform: translateX(0); }
                }
                @keyframes mfoVsPulse {
                    0%, 100% { transform: scale(1); text-shadow: 0 0 20px rgba(255,255,255,0.3); }
                    50% { transform: scale(1.12); text-shadow: 0 0 40px rgba(255,255,255,0.7), 0 0 80px rgba(255,255,255,0.2); }
                }
                @keyframes mfoVsIn {
                    0% { opacity: 0; transform: scale(0.3); }
                    60% { opacity: 1; transform: scale(1.15); }
                    80% { transform: scale(0.95); }
                    100% { opacity: 1; transform: scale(1); }
                }
                @keyframes mfoFadeUp {
                    0% { opacity: 0; transform: translateY(20px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
                @keyframes mfoAuraRing {
                    0% { transform: scale(0.8); opacity: 0; }
                    50% { opacity: 0.5; }
                    100% { transform: scale(2.2); opacity: 0; }
                }
                @keyframes mfoTagsIn {
                    0% { opacity: 0; transform: translateY(12px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
                @keyframes mfoSkipIn {
                    0% { opacity: 0; }
                    100% { opacity: 0.5; }
                }
                @keyframes mfoBgPulse {
                    0%, 100% { opacity: 0.06; }
                    50% { opacity: 0.12; }
                }
            `}</style>

            {/* Radial bg glow */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    background: "radial-gradient(ellipse 70% 50% at 50% 50%, rgba(59,130,246,0.08) 0%, transparent 70%)",
                    animation: "mfoBgPulse 2.5s ease-in-out infinite",
                    pointerEvents: "none",
                }}
            />

            {/* Main content */}
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 32,
                    padding: "0 24px",
                    width: "100%",
                    maxWidth: 480,
                }}
            >
                {/* Title */}
                <div
                    style={{
                        animation: "mfoSlideDown 0.7s cubic-bezier(0.16,1,0.3,1) both",
                        textAlign: "center",
                    }}
                >
                    <span
                        style={{
                            fontSize: "clamp(22px, 5vw, 32px)",
                            fontWeight: 900,
                            color: "var(--accent, #3b82f6)",
                            letterSpacing: "3px",
                            textTransform: "uppercase",
                            display: "block",
                            textShadow: "0 0 30px rgba(59,130,246,0.5)",
                        }}
                    >
                        {title}
                    </span>
                </div>

                {/* VS row */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "clamp(16px, 5vw, 40px)",
                        width: "100%",
                        justifyContent: "center",
                    }}
                >
                    {/* Challenger */}
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 10,
                            animation: "mfoSlideLeft 0.65s cubic-bezier(0.16,1,0.3,1) 0.15s both",
                            flex: 1,
                        }}
                    >
                        <div style={{ position: "relative" }}>
                            <AvatarCircle
                                username={challengerUsername}
                                avatarUrl={challengerAvatarUrl}
                                ringColor="var(--accent, #3b82f6)"
                                size={80}
                            />
                            {/* Aura ring */}
                            <div
                                style={{
                                    position: "absolute",
                                    inset: -4,
                                    borderRadius: "50%",
                                    border: "2px solid rgba(59,130,246,0.6)",
                                    animation: "mfoAuraRing 2s ease-out 0.8s infinite",
                                    pointerEvents: "none",
                                }}
                            />
                        </div>
                        <span
                            style={{
                                fontSize: 14,
                                fontWeight: 800,
                                color: "#fff",
                                maxWidth: 100,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                textAlign: "center",
                            }}
                        >
                            {challengerUsername}
                        </span>
                    </div>

                    {/* VS */}
                    <div
                        style={{
                            animation: "mfoVsIn 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.5s both",
                            flexShrink: 0,
                        }}
                    >
                        <span
                            style={{
                                fontSize: "clamp(40px, 10vw, 64px)",
                                fontWeight: 900,
                                color: "#fff",
                                letterSpacing: "-2px",
                                animation: "mfoVsPulse 1.8s ease-in-out 1.2s infinite",
                                display: "block",
                                lineHeight: 1,
                            }}
                        >
                            VS
                        </span>
                    </div>

                    {/* Challenged */}
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 10,
                            animation: "mfoSlideRight 0.65s cubic-bezier(0.16,1,0.3,1) 0.15s both",
                            flex: 1,
                        }}
                    >
                        <div style={{ position: "relative" }}>
                            <AvatarCircle
                                username={challengedUsername}
                                avatarUrl={challengedAvatarUrl}
                                ringColor="var(--warning, #f59e0b)"
                                size={80}
                            />
                            {/* Aura ring */}
                            <div
                                style={{
                                    position: "absolute",
                                    inset: -4,
                                    borderRadius: "50%",
                                    border: "2px solid rgba(245,158,11,0.6)",
                                    animation: "mfoAuraRing 2s ease-out 1s infinite",
                                    pointerEvents: "none",
                                }}
                            />
                        </div>
                        <span
                            style={{
                                fontSize: 14,
                                fontWeight: 800,
                                color: "#fff",
                                maxWidth: 100,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                textAlign: "center",
                            }}
                        >
                            {challengedUsername}
                        </span>
                    </div>
                </div>

                {/* Game / Best-of tags */}
                {(gameName || (bestOf != null && bestOf > 0)) && (
                    <div
                        style={{
                            display: "flex",
                            gap: 8,
                            flexWrap: "wrap",
                            justifyContent: "center",
                            animation: "mfoTagsIn 0.5s ease-out 0.85s both",
                        }}
                    >
                        {gameName && (
                            <span
                                style={{
                                    fontSize: 13,
                                    fontWeight: 700,
                                    color: "var(--accent, #3b82f6)",
                                    background: "rgba(59,130,246,0.12)",
                                    border: "1px solid rgba(59,130,246,0.3)",
                                    padding: "5px 14px",
                                    borderRadius: 999,
                                }}
                            >
                                {gameName}
                            </span>
                        )}
                        {bestOf != null && bestOf > 0 && (
                            <span
                                style={{
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: "rgba(255,255,255,0.55)",
                                    background: "rgba(255,255,255,0.06)",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    padding: "5px 14px",
                                    borderRadius: 999,
                                }}
                            >
                                Bo{bestOf}
                            </span>
                        )}
                    </div>
                )}

                {/* Tap to continue */}
                <span
                    style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "rgba(255,255,255,0.4)",
                        letterSpacing: "1px",
                        animation: "mfoSkipIn 0.5s ease-out 1.4s both",
                    }}
                >
                    Toca para continuar
                </span>
            </div>
        </div>
    );
}
