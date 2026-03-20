import { getClan } from "@/lib/api/clans";
import type { ClanDetail } from "@/lib/types/clan";
import type { Metadata } from "next";
import { Card, Chip, Avatar } from "@heroui/react";
import { RankedAvatar } from "@/components/RankedAvatar";
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
    const clan = (data as any)?.data ?? (data as any)?.clan ?? data;
    if (clan?.name) name = clan.name;
  } catch {}
  return { title: name, description: `Clan ${name} en Rankeao.` };
}

export default async function ClanDetailPage({ params }: Props) {
  const { id } = await params;
  let clan: ClanDetail | null = null;

  try {
    const data = await getClan(id).catch(() => null);
    clan = ((data as any)?.data ?? (data as any)?.clan ?? data) as ClanDetail | null;
  } catch {
    // silent
  }

  if (!clan) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <p className="text-4xl mb-4">🛡️</p>
        <p className="text-lg font-bold text-[var(--foreground)]">Clan no encontrado</p>
        <p className="text-sm text-[var(--muted)] mt-1">
          Este clan no existe o fue eliminado.
        </p>
        <Link
          href="/clanes"
          className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[var(--accent)]"
        >
          ← Volver a clanes
        </Link>
      </div>
    );
  }

  const members = clan.members ?? [];
  const leader = members.find((m) => m.role === "LEADER");
  const officers = members.filter((m) => m.role === "OFFICER");
  const regularMembers = members.filter((m) => m.role === "MEMBER");

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Banner */}
      <div className="glass p-5 sm:p-6 rounded-2xl relative overflow-hidden">
        {clan.banner_url && (
          <img
            src={clan.banner_url}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-20"
          />
        )}
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] flex items-center justify-center text-3xl shrink-0">
            {clan.logo_url ? (
              <img src={clan.logo_url} alt={clan.name} className="w-16 h-16 rounded-xl object-cover" />
            ) : (
              "🛡️"
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-[var(--foreground)]">{clan.name}</h1>
              <span className="text-xs font-bold text-[var(--accent)] bg-[var(--accent)]/10 px-2 py-0.5 rounded">
                {clan.tag}
              </span>
              {clan.is_recruiting && (
                <Chip color="success" variant="soft" size="sm">
                  Reclutando
                </Chip>
              )}
            </div>
            {clan.description && (
              <p className="text-sm text-[var(--muted)] mt-1 line-clamp-2">
                {clan.description}
              </p>
            )}
            <div className="flex items-center gap-3 mt-2 text-xs text-[var(--muted)]">
              <span>{clan.member_count ?? members.length} miembros</span>
              {clan.game_name && <span>· {clan.game_name}</span>}
              {clan.city && <span>· {clan.city}</span>}
              {clan.rating != null && clan.rating > 0 && (
                <span>· ⭐ {clan.rating}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons (client-side: apply, leave, etc.) */}
      <ClanDetailClient clanId={clan.id} myMembership={clan.my_membership} />

      {/* Stats */}
      {clan.stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Victorias" value={clan.stats.total_wins ?? 0} />
          <StatCard label="Derrotas" value={clan.stats.total_losses ?? 0} />
          <StatCard label="Desafíos ganados" value={clan.stats.challenges_won ?? 0} />
          <StatCard label="Desafíos perdidos" value={clan.stats.challenges_lost ?? 0} />
        </div>
      )}

      {/* Members */}
      <section>
        <h2 className="text-base font-bold text-[var(--foreground)] mb-3">
          Miembros ({members.length})
        </h2>

        <div className="space-y-2">
          {/* Leader */}
          {leader && (
            <MemberRow member={leader} roleLabel="Líder" roleColor="text-yellow-500" />
          )}

          {/* Officers */}
          {officers.map((m) => (
            <MemberRow key={m.user_id} member={m} roleLabel="Oficial" roleColor="text-purple-500" />
          ))}

          {/* Regular members */}
          {regularMembers.map((m) => (
            <MemberRow key={m.user_id} member={m} />
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="glass-sm p-4 flex flex-col items-center gap-1 text-center">
      <p className="text-lg font-extrabold text-[var(--foreground)]">{value}</p>
      <p className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider">
        {label}
      </p>
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
    <Link href={`/perfil/${member.username}`}>
      <div className="glass-sm p-3 flex items-center gap-3 hover:bg-[var(--surface-secondary)] transition-colors cursor-pointer">
        <RankedAvatar
          src={member.avatar_url}
          fallback={member.username[0]?.toUpperCase()}
          elo={member.rating}
          size="sm"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[var(--foreground)] truncate">
            {member.username}
          </p>
          {roleLabel && (
            <p className={`text-[11px] font-bold ${roleColor || "text-[var(--muted)]"}`}>
              {roleLabel}
            </p>
          )}
        </div>
        {member.rating != null && member.rating > 0 && (
          <span className="text-xs text-[var(--muted)]">
            {member.rating} ELO
          </span>
        )}
      </div>
    </Link>
  );
}
