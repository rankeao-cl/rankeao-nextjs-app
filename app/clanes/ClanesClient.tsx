"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Card, Chip, Button, Spinner } from "@heroui/react";
import { useAuth } from "@/context/AuthContext";
import { getClans, getMyClan } from "@/lib/api/clans";
import type { Clan } from "@/lib/types/clan";
import {
  Magnifier,
  Xmark,
  Persons,
  ChevronRight,
  Plus,
  StarFill,
} from "@gravity-ui/icons";

interface Props {
  initialClans: Clan[];
  initialQuery?: string;
}

export default function ClanesClient({ initialClans, initialQuery }: Props) {
  const { session, status } = useAuth();
  const isAuth = status === "authenticated";

  const [clans, setClans] = useState(initialClans);
  const [search, setSearch] = useState(initialQuery || "");
  const [myClan, setMyClan] = useState<Clan | null>(null);
  const [searching, setSearching] = useState(false);

  // Load my clan
  useEffect(() => {
    if (!isAuth || !session?.accessToken) return;
    getMyClan(session.accessToken)
      .then((res) => {
        const clan = (res as any)?.data ?? (res as any)?.clan ?? res;
        if (clan?.id) setMyClan(clan);
      })
      .catch(() => {});
  }, [isAuth, session]);

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!search.trim() && initialClans.length > 0) {
        setClans(initialClans);
        return;
      }
      setSearching(true);
      try {
        const data = await getClans({ search: search.trim(), per_page: 30 });
        const raw = (data as any)?.clans ?? (data as any)?.data;
        setClans(Array.isArray(raw) ? raw : []);
      } catch {
        // silent
      }
      setSearching(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="space-y-5">
      {/* Search + Create */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Magnifier className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[var(--muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar clanes..."
            className="w-full pl-10 pr-9 py-2.5 rounded-full text-sm bg-[var(--field-background)] text-[var(--foreground)] placeholder:text-[var(--field-placeholder)] border border-[var(--border)] focus:border-[var(--focus)] outline-none transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)] cursor-pointer"
            >
              <Xmark className="size-4" />
            </button>
          )}
        </div>
        {isAuth && (
          <Link href="/clanes/new">
            <Button
              variant="primary"
              size="sm"
              className="bg-[var(--accent)] text-white rounded-full px-4 font-semibold shadow-brand-sm"
            >
              <Plus className="size-4 mr-1" />
              Crear
            </Button>
          </Link>
        )}
      </div>

      {/* My Clan Banner */}
      {myClan && (
        <Link href={`/clanes/${myClan.id}`}>
          <div className="rounded-2xl p-4 border border-[var(--accent)] bg-[var(--accent)]/8 flex items-center gap-4 cursor-pointer hover:bg-[var(--accent)]/12 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-[var(--accent)]/15 flex items-center justify-center text-xl shrink-0">
              🛡️
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--accent)] mb-0.5">
                Mi Clan
              </p>
              <p className="text-base font-bold text-[var(--foreground)] truncate">
                {myClan.name}
              </p>
              <p className="text-xs text-[var(--muted)]">
                [{myClan.tag}] · {myClan.member_count ?? 0} miembros
              </p>
            </div>
            <ChevronRight className="size-5 text-[var(--muted)] shrink-0" />
          </div>
        </Link>
      )}

      {/* Loading */}
      {searching && (
        <div className="flex justify-center py-6">
          <Spinner size="md" />
        </div>
      )}

      {/* Clan List */}
      {!searching && clans.length > 0 && (
        <div className="space-y-3">
          {clans.map((clan) => (
            <ClanCard key={clan.id} clan={clan} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!searching && clans.length === 0 && (
        <Card className="glass">
          <Card.Content className="py-16 text-center">
            <p className="text-4xl mb-4">🛡️</p>
            <p className="text-base font-medium text-[var(--foreground)]">
              No se encontraron clanes
            </p>
            <p className="text-sm mt-1 text-[var(--muted)]">
              {search ? "Intenta con otros términos de búsqueda." : "Sé el primero en crear un clan."}
            </p>
          </Card.Content>
        </Card>
      )}
    </div>
  );
}

function ClanCard({ clan }: { clan: Clan }) {
  return (
    <Link href={`/clanes/${clan.id}`}>
      <div className="glass-sm p-4 flex items-center gap-4 cursor-pointer hover:bg-[var(--surface-secondary)] transition-colors">
        {/* Logo */}
        <div className="w-12 h-12 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] flex items-center justify-center text-xl shrink-0">
          {clan.logo_url ? (
            <img
              src={clan.logo_url}
              alt={clan.name}
              className="w-12 h-12 rounded-xl object-cover"
            />
          ) : (
            "🛡️"
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-bold text-[var(--foreground)] truncate">
              {clan.name}
            </p>
            <span className="text-[11px] font-bold text-[var(--accent)] bg-[var(--accent)]/10 px-1.5 py-0.5 rounded shrink-0">
              {clan.tag}
            </span>
          </div>
          {clan.description && (
            <p className="text-xs text-[var(--muted)] line-clamp-1 mb-1">
              {clan.description}
            </p>
          )}
          <div className="flex items-center gap-3 text-[11px] text-[var(--muted)]">
            <span className="flex items-center gap-1">
              <Persons className="size-3" />
              {clan.member_count ?? 0}
            </span>
            {clan.game_name && (
              <span>{clan.game_name}</span>
            )}
            {clan.is_recruiting && (
              <span className="text-emerald-500 font-semibold">Reclutando</span>
            )}
            {clan.rating != null && clan.rating > 0 && (
              <span className="flex items-center gap-0.5">
                <StarFill className="size-3 text-yellow-500" />
                {clan.rating}
              </span>
            )}
          </div>
        </div>

        <ChevronRight className="size-4 text-[var(--muted)] shrink-0" />
      </div>
    </Link>
  );
}
