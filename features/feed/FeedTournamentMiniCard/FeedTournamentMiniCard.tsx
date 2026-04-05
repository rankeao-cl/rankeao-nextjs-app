import Link from "next/link";
import Image from "next/image";
import { Persons } from "@gravity-ui/icons";
import type { Tournament } from "@/lib/types/tournament";
import { getGameBrand, getGameBannerStyle } from "@/lib/gameLogos";

const STATUS_COLORS: Record<string, string> = {
  ROUND_IN_PROGRESS: "var(--success)", STARTED: "var(--success)",
  CHECK_IN: "var(--warning)", OPEN: "var(--accent)",
  in_progress: "var(--success)", check_in: "var(--warning)",
  registration: "var(--accent)", upcoming: "var(--accent)",
};
const STATUS_LABELS: Record<string, string> = {
  ROUND_IN_PROGRESS: "En vivo", STARTED: "En curso",
  CHECK_IN: "Check-in", OPEN: "Abierto",
  in_progress: "En vivo", check_in: "Check-in",
  registration: "Abierto", upcoming: "Próximo",
};

export default function FeedTournamentMiniCard({ tournament: t, style }: { tournament: Tournament; style?: React.CSSProperties }) {
  const sColor = STATUS_COLORS[t.status] ?? "var(--muted)";
  const sLabel = STATUS_LABELS[t.status] ?? t.status;
  const registered = t.registered_count ?? t.current_players ?? 0;
  const gameSlug = t.game || t.game_name || "";
  const gameBrand = getGameBrand(gameSlug);
  const bannerStyle = getGameBannerStyle(gameSlug);

  return (
    <Link
      href={`/torneos/${t.slug ?? t.id}`}
      style={{
        textDecoration: "none",
        borderRadius: 14,
        border: "1px solid var(--border)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        ...style,
      }}
    >
      {/* Mini banner */}
      <div style={{
        height: 40,
        position: "relative",
        ...bannerStyle,
      }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: gameBrand.color, opacity: 0.7 }} />
        {gameBrand.logo && (
          <Image src={gameBrand.logo} alt="" width={22} height={22} style={{
            position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
            height: 22, width: "auto", opacity: 0.18, filter: "brightness(2)",
          }} />
        )}
        <span style={{
          position: "absolute", top: 6, left: 8,
          fontSize: 9, fontWeight: 700, color: sColor,
          backgroundColor: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
          padding: "2px 6px", borderRadius: 6,
          display: "inline-flex", alignItems: "center", gap: 3,
        }}>
          {["in_progress", "ROUND_IN_PROGRESS", "STARTED"].includes(t.status) && (
            <span style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: sColor, animation: "pulse 1.6s ease-in-out infinite" }} />
          )}
          {sLabel}
        </span>
      </div>

      {/* Info */}
      <div style={{
        padding: "8px 10px 10px",
        backgroundColor: "var(--surface-solid)",
        display: "flex", flexDirection: "column", gap: 4, flex: 1,
      }}>
        <span style={{
          fontSize: 12, fontWeight: 700, color: "var(--foreground)",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {t.name}
        </span>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 10, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {t.game_name || t.game}
          </span>
          <span style={{ fontSize: 10, color: "var(--muted)", display: "flex", alignItems: "center", gap: 3, flexShrink: 0 }}>
            <Persons style={{ width: 10, height: 10 }} />
            {registered}
          </span>
        </div>
      </div>
    </Link>
  );
}
