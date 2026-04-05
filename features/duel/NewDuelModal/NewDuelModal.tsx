"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "@heroui/react";
import { mapErrorMessage } from "@/lib/api/errors";
import { autocompleteUsers, getFriends } from "@/lib/api/social";
import { createDuel, broadcastDuelSearch } from "@/lib/api/duels";
import { useAuth } from "@/lib/hooks/use-auth";
import type { UserSearchResult } from "@/lib/types/social";
import type { CatalogGame, CatalogFormat } from "@/lib/types/catalog";

interface NewDuelModalProps {
    open: boolean;
    onClose: () => void;
    games: CatalogGame[];
}

interface FriendItem {
    id: string;
    username: string;
    avatar_url?: string;
}

const BEST_OF_OPTIONS = [1, 3, 5] as const;

export default function NewDuelModal({ open, onClose, games }: NewDuelModalProps) {
    const { session } = useAuth();
    const router = useRouter();

    // Mode: "challenge" = pick specific player, "search" = broadcast to nearby
    const [mode, setMode] = useState<"challenge" | "search">("challenge");

    const [opponentQuery, setOpponentQuery] = useState("");
    const [selectedOpponent, setSelectedOpponent] = useState<UserSearchResult | null>(null);
    const [suggestions, setSuggestions] = useState<UserSearchResult[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const [noResults, setNoResults] = useState(false);
    const [selectedGame, setSelectedGame] = useState<CatalogGame | null>(null);
    const [selectedFormat, setSelectedFormat] = useState<CatalogFormat | null>(null);
    const [bestOf, setBestOf] = useState<1 | 3 | 5>(1);
    const [message, setMessage] = useState("");
    const [sending, setSending] = useState(false);
    const [friends, setFriends] = useState<FriendItem[]>([]);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Fetch friends
    useEffect(() => {
        if (!open || !session?.accessToken) return;
        getFriends({ per_page: 20 }, session.accessToken)
            .then((raw) => {
                const list = raw?.data ?? raw?.friends ?? (Array.isArray(raw) ? raw : []);
                const mapped: FriendItem[] = list
                    .map((f: { id?: string; user_id?: string; username: string; avatar_url?: string }) => ({ id: f.id || f.user_id || "", username: f.username, avatar_url: f.avatar_url }))
                    .filter((f: FriendItem) => f.username !== session.username);
                setFriends(mapped);
            })
            .catch(() => setFriends([]));
    }, [open, session]);

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
                const val = await autocompleteUsers(q, session.accessToken);
                const users: UserSearchResult[] = val?.data ?? val?.users ?? [];
                const filtered = users.filter((u: UserSearchResult) => u.username !== session.username);
                setSuggestions(filtered);
                setShowSuggestions(filtered.length > 0);
                setNoResults(filtered.length === 0);
            } catch {
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
            setMessage("");
            setMode("challenge");
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

    const handleSelectOpponent = (user: UserSearchResult | FriendItem) => {
        setSelectedOpponent(user as UserSearchResult);
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
        if (!session?.accessToken) return;

        if (mode === "search") {
            setSending(true);
            try {
                await broadcastDuelSearch({
                    game_id: selectedGame?.id,
                    best_of: bestOf,
                    message: message.trim() || undefined,
                }, session.accessToken);
                toast.success("Buscando oponente", { description: "Se notificara a jugadores cercanos, amigos y seguidores." });
                onClose();
                router.refresh();
            } catch (err: unknown) {
                toast.danger("Error", { description: mapErrorMessage(err) });
            } finally {
                setSending(false);
            }
        } else {
            if (!selectedOpponent || !selectedGame) return;
            setSending(true);
            try {
                const res = await createDuel({
                    opponent_id: selectedOpponent.id,
                    game_id: selectedGame.id,
                    format_id: selectedFormat?.id,
                    best_of: bestOf,
                    message: message.trim() || undefined,
                }, session.accessToken);
                toast.success("Desafio enviado", { description: `Duelo creado contra @${selectedOpponent.username}` });
                onClose();
                const duelId = res?.duel?.id;
                if (duelId) {
                    router.push(`/duelos/${duelId}`);
                } else {
                    router.refresh();
                }
            } catch (err: unknown) {
                toast.danger("Error", { description: mapErrorMessage(err) });
            } finally {
                setSending(false);
            }
        }
    };

    const canSubmit = mode === "search" || (!!selectedOpponent && !!selectedGame);

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
                    backgroundColor: "var(--surface-solid)",
                    border: "1px solid var(--border)",
                    borderRadius: 16,
                    padding: 24,
                    margin: 16,
                }}
            >
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                    <h2 style={{ color: "var(--foreground)", fontSize: 18, fontWeight: 800, margin: 0 }}>Nuevo Duelo</h2>
                    <button
                        onClick={onClose}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}
                        aria-label="Cerrar"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* Mode toggle — matches Expo */}
                <div style={{
                    display: "flex",
                    backgroundColor: "var(--surface-tertiary)",
                    borderRadius: 10,
                    padding: 3,
                    marginBottom: 16,
                    border: "1px solid var(--border)",
                }}>
                    <button
                        onClick={() => { setMode("challenge"); setSelectedOpponent(null); setOpponentQuery(""); }}
                        style={{
                            flex: 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 6,
                            padding: "10px 0",
                            borderRadius: 10,
                            border: "none",
                            cursor: "pointer",
                            backgroundColor: mode === "challenge" ? "var(--foreground)" : "transparent",
                            color: mode === "challenge" ? "var(--background)" : "var(--muted)",
                            fontSize: 13,
                            fontWeight: 600,
                        }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                        </svg>
                        Desafiar jugador
                    </button>
                    <button
                        onClick={() => { setMode("search"); setSelectedOpponent(null); setOpponentQuery(""); }}
                        style={{
                            flex: 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 6,
                            padding: "10px 0",
                            borderRadius: 10,
                            border: "none",
                            cursor: "pointer",
                            backgroundColor: mode === "search" ? "var(--foreground)" : "transparent",
                            color: mode === "search" ? "var(--background)" : "var(--muted)",
                            fontSize: 13,
                            fontWeight: 600,
                        }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="2" /><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14" />
                        </svg>
                        Buscar oponente
                    </button>
                </div>

                {/* Search broadcast info — matches Expo */}
                {mode === "search" && (
                    <div style={{
                        display: "flex",
                        gap: 12,
                        padding: 14,
                        marginBottom: 16,
                        backgroundColor: "rgba(59,130,246,0.06)",
                        borderRadius: 14,
                        border: "1px solid rgba(59,130,246,0.12)",
                    }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
                            <circle cx="12" cy="12" r="2" /><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14" />
                        </svg>
                        <div style={{ flex: 1 }}>
                            <p style={{ color: "var(--foreground)", fontSize: 13, fontWeight: 700, margin: 0, marginBottom: 2 }}>Buscar oponente cercano</p>
                            <p style={{ color: "var(--muted)", fontSize: 11, lineHeight: "16px", margin: 0 }}>
                                Se notificara a tus amigos, seguidores y jugadores cercanos. El primero en aceptar sera tu oponente.
                            </p>
                        </div>
                    </div>
                )}

                {/* 1. Opponent search with autocomplete (challenge mode only) */}
                {mode === "challenge" && (
                    <div style={{ marginBottom: 20, position: "relative" }} ref={wrapperRef}>
                        <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--muted)", letterSpacing: 0.8, marginBottom: 8 }}>OPONENTE</label>

                        {selectedOpponent ? (
                            <div style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                backgroundColor: "rgba(59,130,246,0.08)",
                                border: "1px solid rgba(59,130,246,0.2)",
                                borderRadius: 10,
                                padding: "10px 14px",
                            }}>
                                {selectedOpponent.avatar_url ? (
                                    <Image src={selectedOpponent.avatar_url} alt={selectedOpponent.username} width={28} height={28} style={{ borderRadius: 999, objectFit: "cover" }} />
                                ) : (
                                    <div style={{ width: 28, height: 28, borderRadius: 999, backgroundColor: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)" }}>
                                            {selectedOpponent.username.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                )}
                                <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>@{selectedOpponent.username}</span>
                                <button
                                    onClick={handleClearOpponent}
                                    style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}
                                    aria-label="Quitar oponente"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            </div>
                        ) : (
                            <>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, backgroundColor: "var(--surface-solid)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 14px" }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                                    </svg>
                                    <input
                                        type="text"
                                        placeholder="Buscar jugador..."
                                        value={opponentQuery}
                                        onChange={(e) => { setOpponentQuery(e.target.value); setShowSuggestions(true); }}
                                        onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                                        style={{ flex: 1, background: "none", border: "none", outline: "none", color: "var(--foreground)", fontSize: 13 }}
                                        autoComplete="off"
                                    />
                                    {loadingSuggestions && (
                                        <div className="animate-spin" style={{ width: 16, height: 16, border: "2px solid var(--overlay)", borderTopColor: "var(--muted)", borderRadius: 999 }} />
                                    )}
                                </div>

                                {/* Suggestions dropdown */}
                                {showSuggestions && suggestions.length > 0 && (
                                    <div style={{
                                        position: "absolute",
                                        top: "100%",
                                        left: 0,
                                        right: 0,
                                        marginTop: 4,
                                        backgroundColor: "var(--surface-solid)",
                                        border: "1px solid var(--overlay)",
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
                                                    borderBottom: "1px solid var(--surface-tertiary)",
                                                    cursor: "pointer",
                                                    transition: "background 0.1s",
                                                }}
                                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--surface)"; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                                            >
                                                {user.avatar_url ? (
                                                    <Image src={user.avatar_url} alt={user.username} width={32} height={32} style={{ borderRadius: 999, objectFit: "cover" }} />
                                                ) : (
                                                    <div style={{ width: 32, height: 32, borderRadius: 999, backgroundColor: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)" }}>
                                                            {user.username.charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                )}
                                                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>@{user.username}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* No results */}
                                {noResults && !loadingSuggestions && opponentQuery.trim().length >= 2 && (
                                    <div style={{
                                        position: "absolute",
                                        top: "100%",
                                        left: 0,
                                        right: 0,
                                        marginTop: 4,
                                        backgroundColor: "var(--surface-solid)",
                                        border: "1px solid var(--overlay)",
                                        borderRadius: 12,
                                        padding: "14px 16px",
                                        zIndex: 10,
                                        boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                                    }}>
                                        <p style={{ fontSize: 12, color: "var(--muted)", margin: 0, textAlign: "center" }}>
                                            No se encontraron jugadores
                                        </p>
                                    </div>
                                )}

                                {/* Friends quick-select — matches Expo */}
                                {!opponentQuery && friends.length > 0 && (
                                    <div style={{ marginTop: 12 }}>
                                        <p style={{ color: "var(--muted)", fontSize: 11, fontWeight: 600, margin: 0, marginBottom: 8 }}>Amigos</p>
                                        <div style={{ display: "flex", gap: 10, overflowX: "auto" }}>
                                            {friends.map((f) => (
                                                <button
                                                    key={f.id}
                                                    onClick={() => handleSelectOpponent(f)}
                                                    style={{
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        alignItems: "center",
                                                        gap: 4,
                                                        width: 64,
                                                        background: "none",
                                                        border: "none",
                                                        cursor: "pointer",
                                                        padding: 0,
                                                    }}
                                                >
                                                    {f.avatar_url ? (
                                                        <Image src={f.avatar_url} alt={f.username} width={44} height={44} style={{ borderRadius: 999, objectFit: "cover" }} />
                                                    ) : (
                                                        <div style={{ width: 44, height: 44, borderRadius: 999, backgroundColor: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--muted)" }}>{f.username[0]?.toUpperCase()}</span>
                                                        </div>
                                                    )}
                                                    <span style={{ fontSize: 10, fontWeight: 600, color: "var(--foreground)", textAlign: "center", maxWidth: 64, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                        {f.username}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* 2. Game selection */}
                <div style={{ marginBottom: 20 }}>
                    <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--muted)", letterSpacing: 0.8, marginBottom: 8 }}>JUEGO</label>
                    <div style={{ display: "flex", gap: 8, overflowX: "auto" }}>
                        {games.map((g) => {
                            const active = selectedGame?.id === g.id;
                            return (
                                <button
                                    key={g.id}
                                    onClick={() => { setSelectedGame(active ? null : g); setSelectedFormat(null); }}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                        padding: "10px 12px",
                                        borderRadius: 10,
                                        border: active ? "1px solid var(--accent)" : "1px solid var(--border)",
                                        backgroundColor: active ? "rgba(59,130,246,0.08)" : "var(--surface-solid)",
                                        cursor: "pointer",
                                        transition: "all 0.15s",
                                        flexShrink: 0,
                                    }}
                                >
                                    {g.logo_url ? (
                                        <Image src={g.logo_url} alt={g.name} width={24} height={24} style={{ borderRadius: 6, objectFit: "cover" }} />
                                    ) : (
                                        <div style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            <span style={{ fontSize: 8, fontWeight: 800, color: "var(--muted)" }}>{g.short_name || g.name.slice(0, 3)}</span>
                                        </div>
                                    )}
                                    <span style={{ fontSize: 11, fontWeight: 600, color: active ? "var(--foreground)" : "var(--muted)" }}>{g.short_name || g.name}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 3. Format selection */}
                {formats.length > 0 && (
                    <div style={{ marginBottom: 20 }}>
                        <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--muted)", letterSpacing: 0.8, marginBottom: 8 }}>FORMATO</label>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                            {formats.map((f) => (
                                <button
                                    key={f.id}
                                    onClick={() => setSelectedFormat(f)}
                                    style={{
                                        padding: "8px 14px",
                                        borderRadius: 999,
                                        border: selectedFormat?.id === f.id ? "1px solid var(--accent)" : "1px solid var(--border)",
                                        backgroundColor: selectedFormat?.id === f.id ? "rgba(59,130,246,0.08)" : "var(--surface-solid)",
                                        cursor: "pointer",
                                        fontSize: 12,
                                        fontWeight: 600,
                                        color: selectedFormat?.id === f.id ? "var(--foreground)" : "var(--muted)",
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
                    <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--muted)", letterSpacing: 0.8, marginBottom: 8 }}>BEST OF</label>
                    <div style={{ display: "flex", gap: 8 }}>
                        {BEST_OF_OPTIONS.map((n) => (
                            <button
                                key={n}
                                onClick={() => setBestOf(n)}
                                style={{
                                    flex: 1,
                                    padding: "12px 0",
                                    borderRadius: 10,
                                    border: bestOf === n ? "1px solid var(--accent)" : "1px solid var(--border)",
                                    backgroundColor: bestOf === n ? "rgba(59,130,246,0.08)" : "var(--surface-solid)",
                                    cursor: "pointer",
                                    fontSize: 13,
                                    fontWeight: 700,
                                    color: bestOf === n ? "var(--foreground)" : "var(--muted)",
                                    transition: "all 0.15s",
                                    textAlign: "center",
                                }}
                            >
                                Bo{n}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 5. Message (optional) — matches Expo */}
                <div style={{ marginBottom: 20 }}>
                    <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--muted)", letterSpacing: 0.8, marginBottom: 8 }}>MENSAJE (OPCIONAL)</label>
                    <textarea
                        placeholder="Un mensaje para tu oponente..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        maxLength={200}
                        rows={2}
                        style={{
                            width: "100%",
                            backgroundColor: "var(--surface-solid)",
                            border: "1px solid var(--border)",
                            borderRadius: 10,
                            padding: "12px 14px",
                            color: "var(--foreground)",
                            fontSize: 13,
                            resize: "none",
                            outline: "none",
                            fontFamily: "inherit",
                        }}
                    />
                </div>

                {/* Info note — matches Expo */}
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: 12,
                    backgroundColor: "rgba(59,130,246,0.06)",
                    borderRadius: 10,
                    marginBottom: 20,
                }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                    <span style={{ flex: 1, color: "var(--muted)", fontSize: 11, lineHeight: "16px" }}>
                        Los duelos son casuales: solo ganas XP, no afectan tu ELO.
                    </span>
                </div>

                {/* Actions */}
                <button
                    onClick={handleSubmit}
                    disabled={!canSubmit || sending}
                    style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        padding: "14px 0",
                        borderRadius: 10,
                        border: "none",
                        backgroundColor: canSubmit ? "var(--accent)" : "rgba(59,130,246,0.3)",
                        cursor: canSubmit && !sending ? "pointer" : "not-allowed",
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#FFFFFF",
                        opacity: sending ? 0.6 : 1,
                        transition: "all 0.15s",
                    }}
                >
                    {sending ? "Enviando..." : (
                        <>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                {mode === "search" ? (
                                    <><circle cx="12" cy="12" r="2" /><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14" /></>
                                ) : (
                                    <><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></>
                                )}
                            </svg>
                            {mode === "search" ? "Buscar oponente" : "Enviar desafio"}
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
