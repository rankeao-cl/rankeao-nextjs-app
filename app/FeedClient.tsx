"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, ShoppingCart, Cup, SquareDashed } from "@gravity-ui/icons";
import { useAuth } from "@/context/AuthContext";
import { createPost } from "@/lib/api/social";

const QUICK_ACTIONS = [
  { href: "/feed/new", Icon: Pencil, label: "Post" },
  { href: "/marketplace/new", Icon: ShoppingCart, label: "Vender" },
  { href: "/decks/new", Icon: SquareDashed, label: "Mazo" },
  { href: "/torneos", Icon: Cup, label: "Torneo" },
];

export default function FeedClient() {
  const { status, session } = useAuth();
  const isAuth = status === "authenticated";
  const [quickPost, setQuickPost] = useState("");
  const [posting, setPosting] = useState(false);

  if (!isAuth) return null;

  const handleQuickPost = async () => {
    if (!quickPost.trim() || posting) return;
    setPosting(true);
    try {
      await createPost({ content: quickPost.trim() });
      setQuickPost("");
    } catch {
      // silent
    }
    setPosting(false);
  };

  return (
    <div
      style={{
        backgroundColor: "#1A1A1E",
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.06)",
        overflow: "hidden",
      }}
    >
      {/* Input row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: 14,
        }}
      >
        {/* Avatar circle */}
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: "#1A1A1E",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              color: "#F2F2F2",
              fontSize: 15,
              fontWeight: 700,
            }}
          >
            {session?.username?.[0]?.toUpperCase() || "?"}
          </span>
        </div>

        {/* Input field */}
        <input
          type="text"
          value={quickPost}
          onChange={(e) => setQuickPost(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleQuickPost();
          }}
          placeholder="¿Qué estás jugando hoy?"
          style={{
            flex: 1,
            backgroundColor: "rgba(255,255,255,0.04)",
            borderRadius: 12,
            paddingLeft: 16,
            paddingRight: 16,
            paddingTop: 10,
            paddingBottom: 10,
            border: "1px solid rgba(255,255,255,0.06)",
            color: "#F2F2F2",
            fontSize: 14,
            outline: "none",
          }}
        />
      </div>

      {/* Quick actions row */}
      <div
        style={{
          display: "flex",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {QUICK_ACTIONS.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 5,
              height: 44,
              marginLeft: 4,
              marginRight: 4,
              marginTop: 6,
              marginBottom: 6,
              borderRadius: 10,
              backgroundColor: "#1A1A1E",
              textDecoration: "none",
            }}
          >
            <action.Icon width={14} height={14} color="#F2F2F2" />
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#F2F2F2",
              }}
            >
              {action.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
