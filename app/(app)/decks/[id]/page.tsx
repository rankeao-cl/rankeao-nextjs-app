import { getDeck } from "@/lib/api/social";
import type { Deck } from "@/lib/types/social";
import DeckDetailClient from "./DeckDetailClient";

export default async function DeckPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [deckResult] = await Promise.allSettled([getDeck(id)]);
  const deckLoadFailed = deckResult.status === "rejected";
  let deck: Deck | null = null;
  if (deckResult.status === "fulfilled") {
    const res = deckResult.value;
    deck = res?.data ?? res?.deck ?? null;
  }

  if (deckLoadFailed) {
    return (
      <div style={{ maxWidth: 768, margin: "0 auto", padding: "60px 16px", textAlign: "center" }}>
        <div style={{
          width: 64, height: 64, borderRadius: 32,
          backgroundColor: "var(--surface-solid)", margin: "0 auto 16px",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontSize: 24, opacity: 0.5 }}>⚠️</span>
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--foreground)", margin: "0 0 4px" }}>No pudimos cargar el mazo</h2>
        <p style={{ fontSize: 14, color: "var(--muted)", margin: 0 }}>Intenta nuevamente en unos segundos.</p>
      </div>
    );
  }

  if (!deck) {
    return (
      <div style={{ maxWidth: 768, margin: "0 auto", padding: "60px 16px", textAlign: "center" }}>
        <div style={{
          width: 64, height: 64, borderRadius: 32,
          backgroundColor: "var(--surface-solid)", margin: "0 auto 16px",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="18" rx="3" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--foreground)", margin: "0 0 4px" }}>Mazo no encontrado</h2>
        <p style={{ fontSize: 14, color: "var(--muted)", margin: 0 }}>Este mazo no existe o fue eliminado.</p>
      </div>
    );
  }

  return <DeckDetailClient deck={deck} />;
}
