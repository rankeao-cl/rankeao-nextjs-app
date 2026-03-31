import { getClan } from "@/lib/api/clans";
import type { ClanDetail } from "@/lib/types/clan";
import type { Metadata } from "next";
import Link from "next/link";
import ClanDetailClient from "./ClanDetailClient";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  let name = "Clan";
  try {
    const data = await getClan(id).catch(() => null);
    const clan = (data as any)?.data?.clan ?? (data as any)?.clan ?? (data as any)?.data ?? data;
    if (clan?.name) name = clan.name;
  } catch {}
  return { title: name, description: `Clan ${name} en Rankeao.` };
}

export default async function ClanDetailPage({ params }: Props) {
  const { id } = await params;
  let clan: ClanDetail | null = null;

  try {
    const data = await getClan(id).catch(() => null);
    clan = ((data as any)?.data?.clan ?? (data as any)?.clan ?? (data as any)?.data ?? data) as ClanDetail | null;
  } catch {}

  if (!clan) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 16px", textAlign: "center" }}>
        <div style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: "var(--surface-solid)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
          <span style={{ fontSize: 32, opacity: 0.4 }}>🛡️</span>
        </div>
        <p style={{ color: "var(--foreground)", fontSize: 18, fontWeight: 700, margin: 0, marginBottom: 4 }}>Clan no encontrado</p>
        <p style={{ color: "var(--muted)", fontSize: 13, margin: 0, marginBottom: 16 }}>Este clan no existe o fue eliminado.</p>
        <Link href="/clanes" style={{ color: "var(--accent)", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>← Volver a clanes</Link>
      </div>
    );
  }

  const members = clan.members ?? [];
  const leader = members.find((m) => m.role === "LEADER");
  const officers = members.filter((m) => m.role === "OFFICER");
  const regularMembers = members.filter((m) => m.role === "MEMBER");
  const memberCount = clan.member_count ?? members.length;
  const hasRating = clan.rating != null && clan.rating > 0;

  return (
    <div className="max-w-3xl mx-auto" style={{ paddingBottom: 48 }}>
      {/* ── Epic Banner ── */}
      <div style={{ position: "relative", height: 180, overflow: "hidden" }}>
        {clan.banner_url ? (
          <img src={clan.banner_url} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        ) : clan.logo_url ? (
          <img src={clan.logo_url} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transform: "scale(3)", filter: "blur(24px)", opacity: 0.2 }} />
        ) : (
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, #1e293b, #0f172a)" }} />
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, var(--background) 0%, rgba(0,0,0,0.45) 40%, rgba(0,0,0,0.1) 100%)" }} />

        {/* Back button */}
        <Link href="/clanes" style={{ position: "absolute", top: 12, left: 12, zIndex: 2, textDecoration: "none" }}>
          <div style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </div>
        </Link>

        {/* Floating badges */}
        <div style={{ position: "absolute", top: 12, right: 12, display: "flex", gap: 4, zIndex: 2 }}>
          {clan.is_recruiting && (
            <span style={{ fontSize: 10, fontWeight: 700, color: "var(--success)", backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", padding: "4px 10px", borderRadius: 999 }}>
              Reclutando
            </span>
          )}
          {clan.game_name && (
            <span style={{ fontSize: 10, fontWeight: 600, color: "var(--foreground)", backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", padding: "4px 10px", borderRadius: 999 }}>
              {clan.game_name}
            </span>
          )}
        </div>
      </div>

      {/* ── Profile section (overlapping banner) ── */}
      <div style={{ padding: "0 16px", marginTop: -48, position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 14 }}>
          {/* Logo */}
          <div style={{
            width: 80, height: 80, borderRadius: 20, border: "4px solid var(--background)",
            backgroundColor: "var(--surface-solid)", overflow: "hidden",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 20px rgba(0,0,0,0.5)", flexShrink: 0,
          }}>
            {clan.logo_url ? (
              <img src={clan.logo_url} alt={clan.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <span style={{ fontSize: 32, fontWeight: 900, color: "var(--accent)" }}>{clan.name?.charAt(0)?.toUpperCase()}</span>
            )}
          </div>

          {/* Name + meta */}
          <div style={{ flex: 1, minWidth: 0, marginBottom: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--foreground)", margin: 0 }}>{clan.name}</h1>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--accent)", backgroundColor: "rgba(59,130,246,0.2)", padding: "2px 8px", borderRadius: 6 }}>{clan.tag}</span>
            </div>
            {clan.description && (
              <p className="line-clamp-2" style={{ fontSize: 13, color: "var(--muted)", margin: 0, marginTop: 4, lineHeight: "18px" }}>{clan.description}</p>
            )}
          </div>
        </div>

        {/* Info row */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12, fontSize: 12, color: "var(--muted)" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            {memberCount} miembros
          </span>
          {clan.city && (
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
              {clan.city}
            </span>
          )}
          {hasRating && (
            <span><span style={{ color: "var(--warning)" }}>★</span> {clan.rating!.toFixed(1)}</span>
          )}
        </div>

        {/* Action buttons */}
        <div style={{ marginTop: 16 }}>
          <ClanDetailClient clanId={clan.id} myMembership={clan.my_membership} members={members} />
        </div>
      </div>

      {/* ── Stats ── */}
      {clan.stats && (
        <div style={{ padding: "0 16px", marginTop: 20 }}>
          <p style={{ color: "var(--muted)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 10, marginLeft: 4 }}>Estadisticas</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
            {[
              { label: "Victorias", value: clan.stats.total_wins ?? 0, color: "var(--success)" },
              { label: "Derrotas", value: clan.stats.total_losses ?? 0, color: "var(--danger)" },
              { label: "Desafios ganados", value: clan.stats.challenges_won ?? 0, color: "var(--accent)" },
              { label: "Desafios perdidos", value: clan.stats.challenges_lost ?? 0, color: "var(--muted)" },
            ].map((stat) => (
              <div key={stat.label} style={{
                backgroundColor: "var(--surface-solid)", borderRadius: 14, border: "1px solid var(--border)",
                padding: "14px 12px", textAlign: "center",
              }}>
                <p style={{ fontSize: 20, fontWeight: 800, color: stat.color, margin: 0 }}>{stat.value}</p>
                <p style={{ fontSize: 10, fontWeight: 600, color: "var(--muted)", margin: 0, marginTop: 2, textTransform: "uppercase", letterSpacing: 0.5 }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Members ── */}
      <div style={{ padding: "0 16px", marginTop: 20 }}>
        <p style={{ color: "var(--muted)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 10, marginLeft: 4 }}>
          Miembros ({members.length})
        </p>
        <div style={{ backgroundColor: "var(--surface-solid)", borderRadius: 16, border: "1px solid var(--border)", overflow: "hidden" }}>
          {/* Leader */}
          {leader && <MemberRow member={leader} roleLabel="Lider" roleColor="var(--warning)" />}
          {leader && (officers.length > 0 || regularMembers.length > 0) && <div style={{ height: 0.5, backgroundColor: "var(--border)", marginLeft: 64 }} />}

          {/* Officers */}
          {officers.map((m, i) => (
            <div key={m.user_id}>
              <MemberRow member={m} roleLabel="Oficial" roleColor="var(--purple)" />
              {(i < officers.length - 1 || regularMembers.length > 0) && <div style={{ height: 0.5, backgroundColor: "var(--border)", marginLeft: 64 }} />}
            </div>
          ))}

          {/* Regular members */}
          {regularMembers.map((m, i) => (
            <div key={m.user_id}>
              <MemberRow member={m} />
              {i < regularMembers.length - 1 && <div style={{ height: 0.5, backgroundColor: "var(--border)", marginLeft: 64 }} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MemberRow({
  member,
  roleLabel,
  roleColor,
}: {
  member: { user_id: string; username: string; avatar_url?: string; role: string; rating?: number };
  roleLabel?: string;
  roleColor?: string;
}) {
  return (
    <Link href={`/perfil/${member.username}`} style={{ textDecoration: "none", display: "block" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px" }}>
        {/* Avatar */}
        <div style={{
          width: 40, height: 40, borderRadius: 20, backgroundColor: "var(--surface-solid)",
          overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, border: "1px solid var(--border)",
        }}>
          {member.avatar_url ? (
            <img src={member.avatar_url} alt={member.username} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--foreground)" }}>{member.username[0]?.toUpperCase()}</span>
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {member.username}
          </p>
          {roleLabel && (
            <p style={{ fontSize: 10, fontWeight: 700, color: roleColor || "var(--muted)", margin: 0, marginTop: 1, textTransform: "uppercase", letterSpacing: 0.5 }}>
              {roleLabel}
            </p>
          )}
        </div>

        {/* ELO */}
        {member.rating != null && member.rating > 0 && (
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)" }}>{member.rating} ELO</span>
        )}

        {/* Chevron */}
        <svg width={14} height={14} viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
          <path d="M6 3l5 5-5 5" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </Link>
  );
}
