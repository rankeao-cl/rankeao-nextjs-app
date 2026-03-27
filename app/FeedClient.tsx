"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getUserFollowing, browseDecks } from "@/lib/api/social";
import type { UserProfile, Deck } from "@/lib/types/social";

type FeedItem =
  | { kind: "user"; date: string; data: UserProfile }
  | { kind: "deck"; date: string; data: Deck };

export default function FeedClient() {
  const { status, session } = useAuth();
  const isAuth = status === "authenticated";

  const [following, setFollowing] = useState<UserProfile[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);

  useEffect(() => {
    if (!isAuth || !session?.username) return;
    getUserFollowing(session.username, { per_page: 20 })
      .then((val: any) => {
        const users = val?.data?.following || val?.data || val?.following || [];
        setFollowing(Array.isArray(users) ? users : []);
      })
      .catch(() => {});
  }, [isAuth, session?.username]);

  useEffect(() => {
    browseDecks({ per_page: 15, sort: "newest" })
      .then((val: any) => {
        const d = val?.data?.decks || val?.data || val?.decks || [];
        setDecks(Array.isArray(d) ? d : []);
      })
      .catch(() => {});
  }, []);

  // Merge and sort by date
  const items = useMemo<FeedItem[]>(() => {
    const userItems: FeedItem[] = following.map(u => ({
      kind: "user",
      date: u.last_seen_at || u.created_at || "",
      data: u,
    }));
    const deckItems: FeedItem[] = decks.map(d => ({
      kind: "deck",
      date: d.updated_at || d.created_at || "",
      data: d,
    }));
    return [...userItems, ...deckItems].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [following, decks]);

  const gradients = [
    "linear-gradient(135deg, #EF4444, #F59E0B)",
    "linear-gradient(135deg, #EC4899, #8B5CF6)",
    "linear-gradient(135deg, var(--accent), #06B6D4)",
    "linear-gradient(135deg, #10B981, #3B82F6)",
    "linear-gradient(135deg, #F59E0B, #EF4444, #EC4899)",
    "linear-gradient(135deg, var(--accent), #8B5CF6, #EC4899)",
  ];

  let gradientIdx = 0;

  return (
    <div>
      <div
        className="feed-stories-scroll"
        style={{
          display: "flex",
          gap: 12,
          overflowX: "auto",
          scrollbarWidth: "none",
          padding: "4px 0",
        }}
      >
        {/* My profile (always first) */}
        {isAuth && (
          <Link
            href={`/perfil/${session?.username}`}
            style={{ textDecoration: "none", flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, width: 72 }}
          >
            <div style={{ position: "relative" }}>
              <div style={{
                width: 68, height: 68, borderRadius: 34,
                background: "var(--foreground)",
                padding: 3, display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <div style={{
                  width: 62, height: 62, borderRadius: 31,
                  backgroundColor: "var(--background)", display: "flex", alignItems: "center", justifyContent: "center",
                  overflow: "hidden",
                }}>
                  <span style={{ fontSize: 20, fontWeight: 700, color: "var(--foreground)" }}>
                    {session?.username?.[0]?.toUpperCase() || "?"}
                  </span>
                </div>
              </div>
              <div style={{
                position: "absolute", bottom: -2, right: -2,
                width: 22, height: 22, borderRadius: 11,
                backgroundColor: "var(--accent)", border: "2px solid var(--background)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth={3} strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 500, color: "var(--muted)", textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%" }}>
              Tu perfil
            </span>
          </Link>
        )}

        {/* Intercalated items */}
        {items.map((item) => {
          const grad = gradients[gradientIdx % gradients.length];
          gradientIdx++;

          if (item.kind === "user") {
            const user = item.data;
            return (
              <Link
                key={`u-${user.id}`}
                href={`/perfil/${user.username}`}
                style={{ textDecoration: "none", flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, width: 72 }}
              >
                <div style={{
                  width: 68, height: 68, borderRadius: 34,
                  background: "var(--accent)",
                  padding: 3, display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <div style={{
                    width: 62, height: 62, borderRadius: 31,
                    backgroundColor: "var(--background)", display: "flex", alignItems: "center", justifyContent: "center",
                    overflow: "hidden",
                  }}>
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.username} style={{ width: 62, height: 62, objectFit: "cover" }} />
                    ) : (
                      <span style={{ fontSize: 20, fontWeight: 700, color: "var(--foreground)" }}>
                        {user.username.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 500, color: "var(--muted)", textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%" }}>
                  {user.username}
                </span>
              </Link>
            );
          }

          const deck = item.data;
          const hasCards = deck.cards && deck.cards.length > 0;
          const coverImg = hasCards ? deck.cards![0].image_url : undefined;

          return (
            <Link
              key={`d-${deck.id}`}
              href={`/decks/${deck.id}`}
              style={{ textDecoration: "none", flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, width: 72 }}
            >
              <div style={{
                width: 68, height: 68, borderRadius: 14,
                background: "var(--accent)",
                padding: 2.5, display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <div style={{
                  width: "100%", height: "100%", borderRadius: 12,
                  backgroundColor: "var(--background)", overflow: "hidden",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {coverImg ? (
                    <img src={coverImg} alt={deck.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, padding: 6, textAlign: "center" }}>
                      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="3" width="20" height="18" rx="3" />
                        <rect x="5" y="1" width="14" height="18" rx="2" opacity="0.4" />
                      </svg>
                      <span style={{ fontSize: 8, fontWeight: 600, color: "var(--muted)", lineHeight: "10px" }}>
                        {deck.game_name || "TCG"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 500, color: "var(--muted)", textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%" }}>
                {deck.name}
              </span>
            </Link>
          );
        })}

        {/* Skeletons when empty */}
        {items.length === 0 && !isAuth && [0,1,2,3,4].map(i => (
          <div key={i} style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, width: 72 }}>
            <div style={{ width: 68, height: 68, borderRadius: 34, backgroundColor: "var(--surface-solid)", border: "2px solid var(--border)", animation: "pulse 1.5s ease-in-out infinite" }} />
            <div style={{ width: 40, height: 8, borderRadius: 4, backgroundColor: "var(--surface-solid)", animation: "pulse 1.5s ease-in-out infinite" }} />
          </div>
        ))}
      </div>

      <style>{`
        .feed-stories-scroll::-webkit-scrollbar { display: none; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  );
}
