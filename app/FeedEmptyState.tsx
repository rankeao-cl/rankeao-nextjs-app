"use client";

import Link from "next/link";
import {
  Cup,
  ShoppingCart,
  Persons,
  Comments,
  ChevronRight,
} from "@gravity-ui/icons";

const suggestions = [
  {
    href: "/torneos",
    Icon: Cup,
    title: "Explorar torneos",
    subtitle: "Compite y sube en el ranking",
  },
  {
    href: "/marketplace",
    Icon: ShoppingCart,
    title: "Buscar cartas",
    subtitle: "Encuentra cartas y accesorios",
  },
  {
    href: "/buscar",
    Icon: Persons,
    title: "Encontrar jugadores",
    subtitle: "Conecta con la comunidad",
  },
];

export default function FeedEmptyState() {
  return (
    <div style={{ paddingTop: 48, paddingBottom: 20, display: "flex", flexDirection: "column", gap: 8 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        {/* Icon circle */}
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: "#1A1A1E",
            border: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
          }}
        >
          <Comments width={28} height={28} color="#888891" />
        </div>
        <p
          style={{
            color: "#F2F2F2",
            fontWeight: 700,
            fontSize: 17,
            marginBottom: 4,
            margin: 0,
          }}
        >
          Tu feed esta vacio
        </p>
        <p
          style={{
            color: "#888891",
            fontSize: 13,
            margin: 0,
          }}
        >
          Descubre contenido
        </p>
      </div>

      {/* Suggestion cards */}
      {suggestions.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#1A1A1E",
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.06)",
            padding: 16,
            gap: 12,
            textDecoration: "none",
          }}
        >
          {/* Icon box */}
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: "#222226",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <item.Icon width={20} height={20} color="#F2F2F2" />
          </div>

          {/* Text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                color: "#F2F2F2",
                fontSize: 15,
                fontWeight: 600,
                margin: 0,
              }}
            >
              {item.title}
            </p>
            <p
              style={{
                color: "#888891",
                fontSize: 13,
                margin: 0,
              }}
            >
              {item.subtitle}
            </p>
          </div>

          {/* Chevron */}
          <ChevronRight width={18} height={18} color="#888891" style={{ flexShrink: 0 }} />
        </Link>
      ))}
    </div>
  );
}
