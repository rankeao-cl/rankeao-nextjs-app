import { Card, CardContent, Badge, Chip } from "@heroui/react";
import type { Tournament } from "@/lib/api";

const statusColors: Record<string, "success" | "warning" | "accent" | "danger" | "default"> = {
  OPEN: "success",
  CHECK_IN: "warning",
  ROUND_IN_PROGRESS: "accent",
  FINISHED: "default",
  CLOSED: "default",
  CANCELLED: "danger",
  DRAFT: "default",
  ROUND_COMPLETE: "accent",
};

const statusLabels: Record<string, string> = {
  OPEN: "Abierto",
  CHECK_IN: "Check-in",
  ROUND_IN_PROGRESS: "En curso",
  ROUND_COMPLETE: "Ronda completa",
  FINISHED: "Finalizado",
  CLOSED: "Cerrado",
  CANCELLED: "Cancelado",
  DRAFT: "Borrador",
};

function formatDate(dateStr?: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-CL", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TournamentCard({ tournament }: { tournament: Tournament }) {
  const status = tournament.status?.toUpperCase() || "OPEN";
  const players = tournament.registered_count ?? 0;
  const maxPlayers = tournament.max_players ?? 0;
  const progress = maxPlayers > 0 ? Math.min(100, Math.round((players / maxPlayers) * 100)) : 0;

  return (
    <Card className="surface-card card-hover overflow-hidden">
      <CardContent className="p-0">
        <div className="h-1.5 w-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-cyan-400" />

        <div className="p-4 space-y-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-white text-base line-clamp-2 flex-1 leading-tight">
            {tournament.name}
            </h3>
            <Chip
              size="sm"
              color={statusColors[status] || "default"}
              variant="soft"
              className="text-xs font-semibold"
            >
              {statusLabels[status] || status}
            </Chip>
          </div>

          <div className="flex flex-wrap gap-2">
            {tournament.game && (
              <Chip size="sm" variant="secondary" className="text-xs border-purple-500/40 text-purple-200">
                {tournament.game}
              </Chip>
            )}
            {tournament.format && (
              <Chip size="sm" variant="secondary" className="text-xs border-cyan-500/30 text-cyan-200">
                {tournament.format}
              </Chip>
            )}
            {tournament.is_ranked && (
              <Badge color="warning" size="sm" content="⭐" placement="top-right">
                <span className="text-[10px] text-amber-200 border border-amber-500/40 rounded-full px-2 py-0.5">
                  Ranked
                </span>
              </Badge>
            )}
          </div>

          <div className="space-y-2 text-xs text-gray-300">
            {tournament.starts_at && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-gray-400">Fecha</span>
                <span className="font-semibold text-gray-100">{formatDate(tournament.starts_at)}</span>
              </div>
            )}
            {(tournament.city || tournament.country) && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-gray-400">Ubicacion</span>
                <span className="font-semibold text-gray-100 truncate">
                  {tournament.city}
                  {tournament.country ? `, ${tournament.country}` : ""}
                </span>
              </div>
            )}
            {maxPlayers > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="text-gray-400">Cupos</span>
                  <span className="text-gray-200 font-semibold">{players} / {maxPlayers} jugadores</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-cyan-400"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {tournament.tenant_name && (
            <div className="border-t border-purple-500/20 pt-3 text-xs text-gray-400">
              Organiza: <span className="text-cyan-300 font-semibold">{tournament.tenant_name}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
