"use client";

import Link from "next/link";
import { ShoppingCart, Cup, SquareDashed, Pencil } from "@gravity-ui/icons";
import { useAuth } from "@/context/AuthContext";
import { useCreatePostModal } from "@/context/CreatePostModalContext";

const QUICK_ACTIONS = [
  { href: "/marketplace/new", Icon: ShoppingCart, label: "Vender" },
  { href: "/decks/new", Icon: SquareDashed, label: "Mazo" },
  { href: "/torneos", Icon: Cup, label: "Torneo" },
];

export default function FeedClient() {
  const { status, session } = useAuth();
  const { openCreatePost } = useCreatePostModal();
  const isAuth = status === "authenticated";

  if (!isAuth) return null;

  return (
    <div
      style={{
        backgroundColor: "#1A1A1E",
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.06)",
        overflow: "hidden",
      }}
    >
      {/* Input row — opens modal */}
      <div
        onClick={openCreatePost}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: 14,
          cursor: "pointer",
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

        {/* Fake input */}
        <div
          style={{
            flex: 1,
            backgroundColor: "rgba(255,255,255,0.04)",
            borderRadius: 12,
            paddingLeft: 16,
            paddingRight: 16,
            paddingTop: 10,
            paddingBottom: 10,
            border: "1px solid rgba(255,255,255,0.06)",
            color: "#888891",
            fontSize: 14,
          }}
        >
          ¿Qué estás jugando hoy?
        </div>
      </div>

      {/* Quick actions row */}
      <div
        style={{
          display: "flex",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Post action — opens modal */}
        <button
          onClick={openCreatePost}
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
            border: "none",
            cursor: "pointer",
          }}
        >
          <Pencil width={14} height={14} color="#F2F2F2" />
          <span style={{ fontSize: 11, fontWeight: 600, color: "#F2F2F2" }}>Post</span>
        </button>

        {/* Other quick actions */}
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
            <span style={{ fontSize: 11, fontWeight: 600, color: "#F2F2F2" }}>{action.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
