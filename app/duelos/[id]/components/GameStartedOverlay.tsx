"use client";

interface GameStartedOverlayProps {
    gameNumber: number;
    totalGames: number;
    mode: "simple" | "advanced";
    gameName?: string;
    formatName?: string;
    isFading: boolean;
    onSkip: () => void;
}

export default function GameStartedOverlay({
    gameNumber,
    totalGames,
    mode,
    gameName,
    formatName,
    isFading,
    onSkip,
}: GameStartedOverlayProps) {
    const isFirstGame = gameNumber === 1;
    const mainTitle = isFirstGame ? "PARTIDA INICIADA" : `PARTIDA ${gameNumber} DE ${totalGames}`;
    const modeLabel = mode === "advanced" ? "Avanzado" : "Simple";
    const modeIcon = mode === "advanced" ? "⚔️" : "⚡";

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
                @keyframes gsoMainIn {
                    0% { opacity: 0; transform: scale(2.5) rotate(-4deg); filter: blur(8px); }
                    55% { opacity: 1; transform: scale(1) rotate(0deg); filter: blur(0); }
                    65% { transform: scale(1.06) rotate(0.5deg); }
                    75%, 100% { opacity: 1; transform: scale(1) rotate(0); }
                }
                @keyframes gsoPulseGlow {
                    0%, 100% {
                        text-shadow:
                            0 0 20px rgba(34,197,94,0.5),
                            0 0 40px rgba(34,197,94,0.2);
                    }
                    50% {
                        text-shadow:
                            0 0 40px rgba(34,197,94,0.9),
                            0 0 80px rgba(34,197,94,0.4),
                            0 0 120px rgba(34,197,94,0.15);
                    }
                }
                @keyframes gsoFadeUp {
                    0% { opacity: 0; transform: translateY(16px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
                @keyframes gsoPillIn {
                    0% { opacity: 0; transform: scale(0.8) translateY(8px); }
                    100% { opacity: 1; transform: scale(1) translateY(0); }
                }
                @keyframes gsoSkipIn {
                    0% { opacity: 0; }
                    100% { opacity: 0.45; }
                }
                @keyframes gsoBgBreath {
                    0%, 100% { opacity: 0.05; }
                    50% { opacity: 0.1; }
                }
                @keyframes gsoRingExpand {
                    0% { transform: scale(0.6); opacity: 0.6; }
                    100% { transform: scale(2.5); opacity: 0; }
                }
                @media (max-width: 640px) {
                    @keyframes gsoMainIn {
                        0% { opacity: 0; transform: scale(2); }
                        55% { opacity: 1; transform: scale(1); }
                        65% { transform: scale(1.04); }
                        75%, 100% { opacity: 1; transform: scale(1); }
                    }
                }
            `}</style>

            {/* Radial bg */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    background: "radial-gradient(ellipse 65% 45% at 50% 50%, rgba(34,197,94,0.07) 0%, transparent 70%)",
                    animation: "gsoBgBreath 2.2s ease-in-out infinite",
                    pointerEvents: "none",
                }}
            />

            {/* Expanding ring */}
            <div
                style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    width: 200,
                    height: 200,
                    marginLeft: -100,
                    marginTop: -100,
                    borderRadius: "50%",
                    border: "2px solid rgba(34,197,94,0.4)",
                    animation: "gsoRingExpand 1.4s ease-out 0.3s both",
                    pointerEvents: "none",
                }}
            />
            <div
                style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    width: 150,
                    height: 150,
                    marginLeft: -75,
                    marginTop: -75,
                    borderRadius: "50%",
                    border: "1px solid rgba(34,197,94,0.25)",
                    animation: "gsoRingExpand 1.4s ease-out 0.5s both",
                    pointerEvents: "none",
                }}
            />

            {/* Content */}
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 24,
                    padding: "0 24px",
                    width: "100%",
                    maxWidth: 480,
                    textAlign: "center",
                }}
            >
                {/* Main title */}
                <div style={{ animation: "gsoMainIn 0.9s cubic-bezier(0.16,1,0.3,1) 0.1s both" }}>
                    <span
                        style={{
                            fontSize: "clamp(26px, 7vw, 44px)",
                            fontWeight: 900,
                            color: "var(--success, #22c55e)",
                            letterSpacing: "2px",
                            textTransform: "uppercase",
                            display: "block",
                            lineHeight: 1.1,
                            animation: "gsoPulseGlow 1.8s ease-in-out 1s infinite",
                        }}
                    >
                        {mainTitle}
                    </span>
                </div>

                {/* Mode pill */}
                <div style={{ animation: "gsoPillIn 0.5s cubic-bezier(0.16,1,0.3,1) 0.65s both" }}>
                    <span
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            fontSize: 14,
                            fontWeight: 700,
                            color: mode === "advanced" ? "var(--warning, #f59e0b)" : "var(--accent, #3b82f6)",
                            background:
                                mode === "advanced"
                                    ? "rgba(245,158,11,0.12)"
                                    : "rgba(59,130,246,0.12)",
                            border:
                                mode === "advanced"
                                    ? "1px solid rgba(245,158,11,0.3)"
                                    : "1px solid rgba(59,130,246,0.3)",
                            padding: "6px 16px",
                            borderRadius: 999,
                        }}
                    >
                        <span>{modeIcon}</span>
                        {modeLabel}
                    </span>
                </div>

                {/* Game / format info */}
                {(gameName || formatName) && (
                    <div
                        style={{
                            display: "flex",
                            gap: 8,
                            flexWrap: "wrap",
                            justifyContent: "center",
                            animation: "gsoFadeUp 0.5s ease-out 0.8s both",
                        }}
                    >
                        {gameName && (
                            <span
                                style={{
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: "rgba(255,255,255,0.6)",
                                    background: "rgba(255,255,255,0.06)",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    padding: "4px 12px",
                                    borderRadius: 999,
                                }}
                            >
                                {gameName}
                            </span>
                        )}
                        {formatName && (
                            <span
                                style={{
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: "rgba(255,255,255,0.6)",
                                    background: "rgba(255,255,255,0.06)",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    padding: "4px 12px",
                                    borderRadius: 999,
                                }}
                            >
                                {formatName}
                            </span>
                        )}
                    </div>
                )}

                {/* Game X of Y indicator (only when best_of > 1) */}
                {totalGames > 1 && (
                    <div style={{ animation: "gsoFadeUp 0.5s ease-out 0.95s both" }}>
                        <span
                            style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: "rgba(255,255,255,0.45)",
                                letterSpacing: "1px",
                                textTransform: "uppercase",
                            }}
                        >
                            Partida {gameNumber} de {totalGames}
                        </span>
                    </div>
                )}

                {/* Tap to continue */}
                <span
                    style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "rgba(255,255,255,0.35)",
                        letterSpacing: "1px",
                        animation: "gsoSkipIn 0.5s ease-out 1.5s both",
                    }}
                >
                    Toca para continuar
                </span>
            </div>
        </div>
    );
}
