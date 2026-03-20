"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "@heroui/react";
import { autocompleteUsers } from "@/lib/api/social";
import { createDuel } from "@/lib/api/duels";
import { useAuth } from "@/context/AuthContext";
import type { UserSearchResult } from "@/lib/types/social";
import type { CatalogGame, CatalogFormat } from "@/lib/types/catalog";

interface NewDuelModalProps {
    open: boolean;
    onClose: () => void;
    games: CatalogGame[];
}

const BEST_OF_OPTIONS = [1, 3, 5] as const;

export default function NewDuelModal({ open, onClose, games }: NewDuelModalProps) {
    const { session } = useAuth();
    const router = useRouter();
    const [opponentQuery, setOpponentQuery] = useState("");
    const [selectedOpponent, setSelectedOpponent] = useState<UserSearchResult | null>(null);
    const [suggestions, setSuggestions] = useState<UserSearchResult[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const [noResults, setNoResults] = useState(false);
    const [selectedGame, setSelectedGame] = useState<CatalogGame | null>(null);
    const [selectedFormat, setSelectedFormat] = useState<CatalogFormat | null>(null);
    const [bestOf, setBestOf] = useState<1 | 3 | 5>(1);
    const [sending, setSending] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Debounced autocomplete
    useEffect(() => {
        if (selectedOpponent) return;

        const q = opponentQuery.trim();
        if (q.length < 2) {
            setSuggestions([]);
            setShowSuggestions(false);
            setNoResults(false);
            return;
        }

        if (!session?.accessToken) return;

        setLoadingSuggestions(true);
        setNoResults(false);

        const delay = setTimeout(async () => {
            try {
                const val = await autocompleteUsers(q, session.accessToken) as any;
                const users: UserSearchResult[] = val?.data?.users || val?.users || val?.data || (Array.isArray(val) ? val : []);
                const filtered = users.filter((u: UserSearchResult) => u.username !== session.username);
                setSuggestions(filtered);
                setShowSuggestions(filtered.length > 0);
                setNoResults(filtered.length === 0);
            } catch (err) {
                console.error("Error autocomplete users:", err);
                setSuggestions([]);
                setNoResults(true);
            } finally {
                setLoadingSuggestions(false);
            }
        }, 300);

        return () => clearTimeout(delay);
    }, [opponentQuery, selectedOpponent, session]);

    // Reset state when modal closes
    useEffect(() => {
        if (!open) {
            setOpponentQuery("");
            setSelectedOpponent(null);
            setSuggestions([]);
            setShowSuggestions(false);
            setNoResults(false);
            setSelectedGame(null);
            setSelectedFormat(null);
            setBestOf(1);
        }
    }, [open]);

    // Close suggestions on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    if (!open) return null;

    const formats = selectedGame?.formats ?? [];

    const handleSelectOpponent = (user: UserSearchResult) => {
        setSelectedOpponent(user);
        setOpponentQuery(user.username);
        setShowSuggestions(false);
        setSuggestions([]);
    };

    const handleClearOpponent = () => {
        setSelectedOpponent(null);
        setOpponentQuery("");
        setSuggestions([]);
    };

    const handleSubmit = async () => {
        if (!selectedOpponent || !selectedGame || !session?.accessToken) return;
        setSending(true);
        try {
            const res = await createDuel({
                opponent_id: selectedOpponent.id,
                game_id: selectedGame.id,
                format_id: selectedFormat?.id,
                best_of: bestOf,
            }, session.accessToken);
            toast.success("Desafio enviado", { description: `Duelo creado contra @${selectedOpponent.username}` });
            onClose();
            const duelId = res?.duel?.id;
            if (duelId) {
                router.push(`/duelos/${duelId}`);
            } else {
                router.refresh();
            }
        } catch (err: any) {
            toast.danger("Error", { description: err?.message || "No se pudo crear el duelo" });
        } finally {
            setSending(false);
        }
    };

    const handleReset = () => {
        setOpponentQuery("");
        setSelectedOpponent(null);
        setSuggestions([]);
        setSelectedGame(null);
        setSelectedFormat(null);
        setBestOf(1);
    };

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 100,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(0,0,0,0.6)",
                backdropFilter: "blur(4px)",
            }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div
                style={{
                    width: "100%",
                    maxWidth: 480,
                    maxHeight: "90vh",
                    overflowY: "auto",
                    backgroundColor: "#1A1A1E",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 16,
                    padding: 24,
                    margin: 16,
                }}
            >
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                    <h2 style={{ color: "#F2F2F2", fontSize: 18, fontWeight: 800, margin: 0 }}>Nuevo Duelo</h2>
                    <button
                        onClick={onClose}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}
                        aria-label="Cerrar"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888891" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* 1. Opponent search with autocomplete */}
                <div style={{ marginBottom: 20, position: "relative" }} ref={wrapperRef}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#888891", marginBottom: 8 }}>Oponente</label>

                    {selectedOpponent ? (
                        /* Selected opponent chip */
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            backgroundColor: "rgba(59,130,246,0.1)",
                            border: "1px solid rgba(59,130,246,0.3)",
                            borderRadius: 12,
                            padding: "8px 14px",
                        }}>
                            {selectedOpponent.avatar_url ? (
                                <Image src={selectedOpponent.avatar_url} alt={selectedOpponent.username} width={28} height={28} style={{ borderRadius: 999, objectFit: "cover" }} />
                            ) : (
                                <div style={{ width: 28, height: 28, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: "#888891" }}>
                                        {selectedOpponent.username.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            )}
                            <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#F2F2F2" }}>@{selectedOpponent.username}</span>
                            <button
                                onClick={handleClearOpponent}
                                style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}
                                aria-label="Quitar oponente"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888891" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                    ) : (
                        /* Search input */
                        <div style={{ display: "flex", alignItems: "center", gap: 8, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 12, padding: "10px 14px" }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888891" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Buscar jugador por nombre..."
                                value={opponentQuery}
                                onChange={(e) => { setOpponentQuery(e.target.value); setShowSuggestions(true); }}
                                onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                                style={{ flex: 1, background: "none", border: "none", outline: "none", color: "#F2F2F2", fontSize: 13 }}
                                autoComplete="off"
                            />
                            {loadingSuggestions && (
                                <div className="animate-spin" style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.1)", borderTopColor: "#888891", borderRadius: 999 }} />
                            )}
                        </div>
                    )}

                    {/* No results message */}
                    {noResults && !selectedOpponent && !loadingSuggestions && opponentQuery.trim().length >= 2 && (
                        <div style={{
                            position: "absolute",
                            top: "100%",
                            left: 0,
                            right: 0,
                            marginTop: 4,
                            backgroundColor: "#1A1A1E",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: 12,
                            padding: "14px 16px",
                            zIndex: 10,
                            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                        }}>
                            <p style={{ fontSize: 12, color: "#888891", margin: 0, textAlign: "center" }}>
                                No se encontraron jugadores
                            </p>
                        </div>
                    )}

                    {/* Autocomplete dropdown */}
                    {showSuggestions && suggestions.length > 0 && !selectedOpponent && (
                        <div style={{
                            position: "absolute",
                            top: "100%",
                            left: 0,
                            right: 0,
                            marginTop: 4,
                            backgroundColor: "#1A1A1E",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: 12,
                            overflow: "hidden",
                            zIndex: 10,
                            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                        }}>
                            {suggestions.map((user) => (
                                <button
                                    key={user.id}
                                    onClick={() => handleSelectOpponent(user)}
                                    style={{
                                        width: "100%",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 10,
                                        padding: "10px 14px",
                                        background: "none",
                                        border: "none",
                                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                                        cursor: "pointer",
                                        transition: "background 0.1s",
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.06)"; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                                >
                                    {user.avatar_url ? (
                                        <Image src={user.avatar_url} alt={user.username} width={32} height={32} style={{ borderRadius: 999, objectFit: "cover" }} />
                                    ) : (
                                        <div style={{ width: 32, height: 32, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            <span style={{ fontSize: 12, fontWeight: 700, color: "#888891" }}>
                                                {user.username.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                    )}
                                    <span style={{ fontSize: 13, fontWeight: 600, color: "#F2F2F2" }}>@{user.username}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* 2. Game selection */}
                <div style={{ marginBottom: 20 }}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#888891", marginBottom: 8 }}>Juego</label>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 8 }}>
                        {games.map((g) => (
                            <button
                                key={g.id}
                                onClick={() => { setSelectedGame(g); setSelectedFormat(null); }}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    padding: "10px 12px",
                                    borderRadius: 12,
                                    border: selectedGame?.id === g.id ? "1px solid #3B82F6" : "1px solid rgba(255,255,255,0.06)",
                                    backgroundColor: selectedGame?.id === g.id ? "rgba(59,130,246,0.1)" : "rgba(255,255,255,0.06)",
                                    cursor: "pointer",
                                    transition: "all 0.15s",
                                }}
                            >
                                {g.logo_url ? (
                                    <Image src={g.logo_url} alt={g.name} width={24} height={24} style={{ borderRadius: 6, objectFit: "cover" }} />
                                ) : (
                                    <div style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <span style={{ fontSize: 9, fontWeight: 800, color: "#888891" }}>{g.short_name || g.name.slice(0, 3)}</span>
                                    </div>
                                )}
                                <span style={{ fontSize: 12, fontWeight: 600, color: selectedGame?.id === g.id ? "#F2F2F2" : "#888891" }}>{g.short_name || g.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* 3. Format selection */}
                {formats.length > 0 && (
                    <div style={{ marginBottom: 20 }}>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#888891", marginBottom: 8 }}>Formato</label>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                            {formats.map((f) => (
                                <button
                                    key={f.id}
                                    onClick={() => setSelectedFormat(f)}
                                    style={{
                                        padding: "8px 14px",
                                        borderRadius: 999,
                                        border: selectedFormat?.id === f.id ? "1px solid #3B82F6" : "1px solid rgba(255,255,255,0.06)",
                                        backgroundColor: selectedFormat?.id === f.id ? "rgba(59,130,246,0.1)" : "rgba(255,255,255,0.06)",
                                        cursor: "pointer",
                                        fontSize: 12,
                                        fontWeight: 600,
                                        color: selectedFormat?.id === f.id ? "#F2F2F2" : "#888891",
                                        transition: "all 0.15s",
                                    }}
                                >
                                    {f.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* 4. Best of toggle */}
                <div style={{ marginBottom: 20 }}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#888891", marginBottom: 8 }}>Best of</label>
                    <div style={{ display: "flex", gap: 8 }}>
                        {BEST_OF_OPTIONS.map((n) => (
                            <button
                                key={n}
                                onClick={() => setBestOf(n)}
                                style={{
                                    flex: 1,
                                    padding: "10px 0",
                                    borderRadius: 12,
                                    border: bestOf === n ? "1px solid #3B82F6" : "1px solid rgba(255,255,255,0.06)",
                                    backgroundColor: bestOf === n ? "rgba(59,130,246,0.1)" : "rgba(255,255,255,0.06)",
                                    cursor: "pointer",
                                    fontSize: 13,
                                    fontWeight: 700,
                                    color: bestOf === n ? "#F2F2F2" : "#888891",
                                    transition: "all 0.15s",
                                }}
                            >
                                Bo{n}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 8 }}>
                    <button
                        onClick={() => { handleReset(); onClose(); }}
                        style={{
                            flex: 1,
                            padding: "12px 0",
                            borderRadius: 12,
                            border: "1px solid rgba(255,255,255,0.06)",
                            backgroundColor: "rgba(255,255,255,0.06)",
                            cursor: "pointer",
                            fontSize: 13,
                            fontWeight: 700,
                            color: "#888891",
                        }}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!selectedOpponent || !selectedGame || sending}
                        style={{
                            flex: 2,
                            padding: "12px 0",
                            borderRadius: 12,
                            border: "none",
                            backgroundColor: (!selectedOpponent || !selectedGame) ? "rgba(59,130,246,0.3)" : "#3B82F6",
                            cursor: (!selectedOpponent || !selectedGame) ? "not-allowed" : "pointer",
                            fontSize: 13,
                            fontWeight: 700,
                            color: "#FFFFFF",
                            opacity: sending ? 0.6 : 1,
                            transition: "all 0.15s",
                        }}
                    >
                        {sending ? "Enviando..." : "Enviar desafio"}
                    </button>
                </div>
            </div>
        </div>
    );
}
