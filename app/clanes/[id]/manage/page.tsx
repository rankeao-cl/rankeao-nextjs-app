"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Button,
  Card,
  Chip,
  Input,
  Label,
  ListBox,
  Select,
  Spinner,
  TextArea,
  TextField,
  toast,
} from "@heroui/react";
import { useAuth } from "@/context/AuthContext";
import {
  getClan,
  updateClan,
  deleteClan,
  listClanApplications,
  acceptClanApplication,
  rejectClanApplication,
  removeClanMember,
  promoteClanMember,
  demoteClanMember,
  transferLeadership,
} from "@/lib/api/clans";
import { getGames } from "@/lib/api/catalog";
import { RankedAvatar } from "@/components/RankedAvatar";
import type { CatalogGame } from "@/lib/types/catalog";
import type {
  ClanDetail,
  ClanMember,
  ClanApplication,
  CreateClanRequest,
} from "@/lib/types/clan";

type ManageTab = "editar" | "miembros" | "solicitudes";

const ROLE_LABELS: Record<string, string> = {
  LEADER: "Lider",
  OFFICER: "Oficial",
  MEMBER: "Miembro",
};

const ROLE_COLORS: Record<string, string> = {
  LEADER: "text-yellow-500",
  OFFICER: "text-purple-500",
  MEMBER: "text-[var(--muted)]",
};

const ROLE_ORDER: Record<string, number> = {
  LEADER: 0,
  OFFICER: 1,
  MEMBER: 2,
};

export default function ManageClanPage() {
  const params = useParams();
  const clanId = params.id as string;
  const router = useRouter();
  const { session, status } = useAuth();
  const token = session?.accessToken;

  const [activeTab, setActiveTab] = useState<ManageTab>("editar");
  const [clan, setClan] = useState<ClanDetail | null>(null);
  const [members, setMembers] = useState<ClanMember[]>([]);
  const [applications, setApplications] = useState<ClanApplication[]>([]);
  const [games, setGames] = useState<CatalogGame[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  // Edit form
  const [editName, setEditName] = useState("");
  const [editTag, setEditTag] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editGameId, setEditGameId] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editLogoUrl, setEditLogoUrl] = useState("");
  const [editBannerUrl, setEditBannerUrl] = useState("");
  const [editRecruitMinElo, setEditRecruitMinElo] = useState("");
  const [editMaxMembers, setEditMaxMembers] = useState("");
  const [editRecruiting, setEditRecruiting] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Load clan data
  const loadClan = useCallback(async () => {
    try {
      const data = await getClan(clanId);
      const c = ((data as any)?.data ?? (data as any)?.clan ?? data) as ClanDetail | null;
      if (!c) return;
      setClan(c);
      const m = c.members ?? [];
      setMembers(
        [...m].sort(
          (a, b) => (ROLE_ORDER[a.role] ?? 9) - (ROLE_ORDER[b.role] ?? 9)
        )
      );
      // Init form
      setEditName(c.name);
      setEditTag(c.tag);
      setEditDescription(c.description ?? "");
      setEditGameId(c.game_id ?? "");
      setEditCity(c.city ?? "");
      setEditLogoUrl(c.logo_url ?? "");
      setEditBannerUrl(c.banner_url ?? "");
      setEditRecruitMinElo(String(c.recruit_min_elo ?? ""));
      setEditMaxMembers(String(c.max_members ?? ""));
      setEditRecruiting(c.is_recruiting ?? true);
    } catch {
      // silent
    }
  }, [clanId]);

  const loadApplications = useCallback(async () => {
    if (!token) return;
    try {
      const data = await listClanApplications(clanId, token);
      const apps: ClanApplication[] =
        (data as any)?.applications ?? (data as any)?.data ?? [];
      setApplications(apps.filter((a) => a.status === "PENDING" || a.status === "pending"));
    } catch {
      // silent
    }
  }, [clanId, token]);

  useEffect(() => {
    Promise.all([
      loadClan(),
      loadApplications(),
      getGames()
        .then((res) => {
          const list = res?.data ?? [];
          if (Array.isArray(list)) setGames(list);
        })
        .catch(() => {}),
    ]).finally(() => setPageLoading(false));
  }, [loadClan, loadApplications]);

  // Guard: redirect if not authenticated
  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  // Loading
  if (pageLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 flex justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  // Not found
  if (!clan) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <p className="text-4xl mb-4">🛡️</p>
        <p className="text-lg font-bold text-[var(--foreground)]">
          Clan no encontrado
        </p>
        <button
          onClick={() => router.push("/clanes")}
          className="mt-4 text-sm font-semibold text-[var(--accent)]"
        >
          ← Volver a clanes
        </button>
      </div>
    );
  }

  // Check if leader
  const myMembership = clan.my_membership;
  const isLeader = myMembership?.role === "LEADER";

  if (!isLeader) {
    router.push(`/clanes/${clanId}`);
    return null;
  }

  // ── Edit handlers ──

  const handleSave = async () => {
    if (!editName.trim()) {
      toast.danger("El nombre no puede estar vacio");
      return;
    }
    if (editTag.length < 3 || editTag.length > 5) {
      toast.danger("El tag debe tener entre 3 y 5 caracteres");
      return;
    }
    if (!token) return;

    setSaving(true);
    try {
      const payload: Partial<CreateClanRequest> = {
        name: editName.trim(),
        tag: editTag.trim().toUpperCase(),
        description: editDescription.trim() || undefined,
        game_id: editGameId || undefined,
        city: editCity.trim() || undefined,
        logo_url: editLogoUrl.trim() || undefined,
        banner_url: editBannerUrl.trim() || undefined,
        recruit_min_elo: editRecruitMinElo ? parseInt(editRecruitMinElo) : undefined,
        max_members: editMaxMembers ? parseInt(editMaxMembers) : undefined,
        is_recruiting: editRecruiting,
      };
      await updateClan(clanId, payload, token);
      toast.success("Clan actualizado");
      await loadClan();
    } catch {
      toast.danger("No se pudo actualizar el clan");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!token) return;
    setDeleting(true);
    try {
      await deleteClan(clanId, token);
      toast.success("Clan eliminado");
      router.push("/clanes");
    } catch {
      toast.danger("No se pudo eliminar el clan");
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  // ── Member handlers ──

  const handlePromote = async (userId: string, username: string) => {
    if (!token) return;
    try {
      await promoteClanMember(clanId, userId, token);
      toast.success(`${username} ha sido promovido`);
      await loadClan();
    } catch {
      toast.danger("No se pudo promover al miembro");
    }
  };

  const handleDemote = async (userId: string, username: string) => {
    if (!token) return;
    try {
      await demoteClanMember(clanId, userId, token);
      toast.success(`${username} ha sido degradado`);
      await loadClan();
    } catch {
      toast.danger("No se pudo degradar al miembro");
    }
  };

  const handleKick = async (userId: string, username: string) => {
    if (!confirm(`¿Expulsar a ${username} del clan?`)) return;
    if (!token) return;
    try {
      await removeClanMember(clanId, userId, token);
      toast.success(`${username} ha sido expulsado`);
      await loadClan();
    } catch {
      toast.danger("No se pudo expulsar al miembro");
    }
  };

  const handleTransfer = async (userId: string, username: string) => {
    if (
      !confirm(
        `¿Transferir el liderazgo a ${username}? Esta accion no se puede deshacer.`
      )
    )
      return;
    if (!token) return;
    try {
      await transferLeadership(clanId, userId, token);
      toast.success(`Liderazgo transferido a ${username}`);
      router.push(`/clanes/${clanId}`);
    } catch {
      toast.danger("No se pudo transferir el liderazgo");
    }
  };

  // ── Application handlers ──

  const handleAccept = async (appId: string) => {
    if (!token) return;
    try {
      await acceptClanApplication(clanId, appId, token);
      toast.success("Solicitud aceptada");
      await Promise.all([loadClan(), loadApplications()]);
    } catch {
      toast.danger("No se pudo aceptar la solicitud");
    }
  };

  const handleReject = async (appId: string) => {
    if (!token) return;
    try {
      await rejectClanApplication(clanId, appId, token);
      toast.success("Solicitud rechazada");
      await loadApplications();
    } catch {
      toast.danger("No se pudo rechazar la solicitud");
    }
  };

  // ── Tabs config ──

  const tabs: { key: ManageTab; label: string; badge?: number }[] = [
    { key: "editar", label: "Editar" },
    { key: "miembros", label: "Miembros" },
    {
      key: "solicitudes",
      label: "Solicitudes",
      badge: applications.length,
    },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <Chip color="accent" variant="soft" size="sm" className="mb-3 px-3">
          Administrar
        </Chip>
        <h1 className="text-xl font-bold text-[var(--foreground)]">
          {clan.name}
        </h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          Gestiona la configuracion, miembros y solicitudes de tu clan.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[var(--border)]">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key);
              if (tab.key === "solicitudes") loadApplications();
            }}
            className={`relative px-4 py-2.5 text-sm font-semibold transition-colors cursor-pointer ${
              activeTab === tab.key
                ? "text-[var(--foreground)]"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            <span className="flex items-center gap-1.5">
              {tab.label}
              {tab.badge != null && tab.badge > 0 && (
                <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[11px] font-bold text-white bg-red-500 rounded-full">
                  {tab.badge}
                </span>
              )}
            </span>
            {activeTab === tab.key && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--foreground)] rounded-t" />
            )}
          </button>
        ))}
      </div>

      {/* ── Edit Tab ── */}
      {activeTab === "editar" && (
        <Card className="surface-card rounded-2xl overflow-hidden">
          <Card.Content className="p-5 space-y-4">
            <TextField className="space-y-1 flex flex-col">
              <Label className="text-xs text-[var(--muted)]">
                Nombre del clan
              </Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                maxLength={50}
              />
            </TextField>

            <TextField className="space-y-1 flex flex-col">
              <Label className="text-xs text-[var(--muted)]">
                Tag (3-5 caracteres)
              </Label>
              <Input
                value={editTag}
                onChange={(e) =>
                  setEditTag(
                    e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "")
                  )
                }
                maxLength={5}
              />
            </TextField>

            <Select
              selectedKey={editGameId || null}
              onSelectionChange={(key) => setEditGameId(String(key || ""))}
            >
              <Label>Juego</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  <ListBox.Item key="" id="" textValue="Cualquiera">
                    Cualquiera
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                  {games.map((g) => (
                    <ListBox.Item key={g.id} id={g.id} textValue={g.name}>
                      {g.name}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>

            <TextField className="space-y-1 flex flex-col">
              <Label className="text-xs text-[var(--muted)]">Descripcion</Label>
              <TextArea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
                placeholder="Describe tu clan..."
              />
            </TextField>

            <TextField className="space-y-1 flex flex-col">
              <Label className="text-xs text-[var(--muted)]">Ciudad</Label>
              <Input
                value={editCity}
                onChange={(e) => setEditCity(e.target.value)}
                placeholder="Ej: Santiago"
              />
            </TextField>

            <TextField className="space-y-1 flex flex-col">
              <Label className="text-xs text-[var(--muted)]">URL Logo</Label>
              <Input
                value={editLogoUrl}
                onChange={(e) => setEditLogoUrl(e.target.value)}
                placeholder="https://..."
              />
            </TextField>

            <TextField className="space-y-1 flex flex-col">
              <Label className="text-xs text-[var(--muted)]">URL Banner</Label>
              <Input
                value={editBannerUrl}
                onChange={(e) => setEditBannerUrl(e.target.value)}
                placeholder="https://..."
              />
            </TextField>

            <TextField className="space-y-1 flex flex-col">
              <Label className="text-xs text-[var(--muted)]">ELO minimo para unirse</Label>
              <Input
                type="number"
                value={editRecruitMinElo}
                onChange={(e) => setEditRecruitMinElo(e.target.value)}
                placeholder="0"
              />
            </TextField>

            <TextField className="space-y-1 flex flex-col">
              <Label className="text-xs text-[var(--muted)]">Maximo de miembros</Label>
              <Input
                type="number"
                value={editMaxMembers}
                onChange={(e) => setEditMaxMembers(e.target.value)}
                placeholder="50"
              />
            </TextField>

            <div className="flex items-center justify-between glass-sm p-4 rounded-xl">
              <span className="text-sm font-medium text-[var(--foreground)]">
                Reclutando miembros
              </span>
              <Button
                type="button"
                size="sm"
                variant={editRecruiting ? "primary" : "secondary"}
                onPress={() => setEditRecruiting(!editRecruiting)}
                className="rounded-full px-4"
              >
                {editRecruiting ? "Activo" : "Inactivo"}
              </Button>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                className="flex-1 font-semibold"
                style={{
                  background: "var(--accent)",
                  color: "var(--accent-foreground)",
                }}
                onPress={handleSave}
                isPending={saving}
              >
                Guardar cambios
              </Button>
            </div>

            {/* Delete */}
            <div className="border-t border-[var(--border)] pt-4 mt-4">
              {confirmDelete ? (
                <div className="space-y-3">
                  <p className="text-sm text-red-500 font-medium">
                    ¿Estas seguro? Esta accion es irreversible.
                  </p>
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      size="sm"
                      className="bg-red-500 text-white font-semibold rounded-full px-4"
                      onPress={handleDelete}
                      isPending={deleting}
                    >
                      Confirmar eliminacion
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="tertiary"
                      onPress={() => setConfirmDelete(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-red-500 hover:bg-red-500/10 font-semibold rounded-full"
                  onPress={() => setConfirmDelete(true)}
                >
                  Eliminar clan
                </Button>
              )}
            </div>
          </Card.Content>
        </Card>
      )}

      {/* ── Members Tab ── */}
      {activeTab === "miembros" && (
        <div className="space-y-2">
          {members.length === 0 ? (
            <Card className="glass">
              <Card.Content className="py-12 text-center">
                <p className="text-sm text-[var(--muted)]">Sin miembros</p>
              </Card.Content>
            </Card>
          ) : (
            members.map((member) => {
              const canManage =
                member.role !== "LEADER" && isLeader;

              return (
                <div
                  key={member.user_id}
                  className="glass-sm p-3 flex items-center gap-3"
                >
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
                    <p
                      className={`text-[11px] font-bold ${
                        ROLE_COLORS[member.role] ?? "text-[var(--muted)]"
                      }`}
                    >
                      {ROLE_LABELS[member.role] ?? member.role}
                    </p>
                  </div>

                  {member.rating != null && member.rating > 0 && (
                    <span className="text-xs text-[var(--muted)] mr-2">
                      {member.rating} ELO
                    </span>
                  )}

                  {canManage && (
                    <div className="flex items-center gap-1">
                      {member.role === "MEMBER" && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="text-[var(--accent)] text-xs px-2 min-w-0"
                          onPress={() =>
                            handlePromote(member.user_id, member.username)
                          }
                        >
                          Promover
                        </Button>
                      )}
                      {member.role === "OFFICER" && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="text-yellow-500 text-xs px-2 min-w-0"
                          onPress={() =>
                            handleDemote(member.user_id, member.username)
                          }
                        >
                          Degradar
                        </Button>
                      )}
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="text-red-500 text-xs px-2 min-w-0"
                        onPress={() =>
                          handleKick(member.user_id, member.username)
                        }
                      >
                        Expulsar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="text-yellow-500 text-xs px-2 min-w-0"
                        onPress={() =>
                          handleTransfer(member.user_id, member.username)
                        }
                      >
                        Transferir
                      </Button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── Applications Tab ── */}
      {activeTab === "solicitudes" && (
        <div className="space-y-2">
          {applications.length === 0 ? (
            <Card className="glass">
              <Card.Content className="py-12 text-center">
                <p className="text-4xl mb-3">📬</p>
                <p className="text-sm font-medium text-[var(--foreground)]">
                  No hay solicitudes pendientes
                </p>
                <p className="text-xs text-[var(--muted)] mt-1">
                  Las solicitudes de jugadores apareceran aqui.
                </p>
              </Card.Content>
            </Card>
          ) : (
            applications.map((app) => (
              <div
                key={app.id}
                className="glass-sm p-3 flex items-center gap-3"
              >
                <RankedAvatar
                  src={app.avatar_url}
                  fallback={
                    app.username?.[0]?.toUpperCase() ?? "U"
                  }
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--foreground)] truncate">
                    {app.username ?? "Usuario"}
                  </p>
                  {app.message && (
                    <p className="text-xs text-[var(--muted)] line-clamp-1">
                      {app.message}
                    </p>
                  )}
                  {app.created_at && (
                    <p className="text-[11px] text-[var(--muted)]">
                      {new Date(app.created_at).toLocaleDateString("es-CL")}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    className="bg-emerald-500 text-white text-xs font-semibold rounded-full px-3 min-w-0"
                    onPress={() => handleAccept(app.id)}
                  >
                    Aceptar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-red-500 text-xs font-semibold px-3 min-w-0"
                    onPress={() => handleReject(app.id)}
                  >
                    Rechazar
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
