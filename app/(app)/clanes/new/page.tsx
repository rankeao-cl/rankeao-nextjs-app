"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react/button";
import { Card } from "@heroui/react/card";
import { Chip } from "@heroui/react/chip";
import { Input } from "@heroui/react/input";
import { Label } from "@heroui/react/label";
import { ListBox } from "@heroui/react/list-box";
import { Select } from "@heroui/react/select";
import { TextArea } from "@heroui/react/textarea";
import { TextField } from "@heroui/react/textfield";
import { toast } from "@heroui/react/toast";

import { useAuth } from "@/lib/hooks/use-auth";
import { createClan } from "@/lib/api/clans";
import { getGames } from "@/lib/api/catalog";
import type { CatalogGame } from "@/lib/types/catalog";
import type { CreateClanRequest } from "@/lib/types/clan";

export default function NewClanPage() {
  const router = useRouter();
  const { session, status } = useAuth();
  const [loading, setLoading] = useState(false);
  const [games, setGames] = useState<CatalogGame[]>([]);

  const [name, setName] = useState("");
  const [tag, setTag] = useState("");
  const [description, setDescription] = useState("");
  const [gameId, setGameId] = useState("");
  const [city, setCity] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [recruitMinElo, setRecruitMinElo] = useState("");
  const [maxMembers, setMaxMembers] = useState("");
  const [isRecruiting, setIsRecruiting] = useState(true);

  useEffect(() => {
    getGames()
      .then((res) => {
        const list = res?.data ?? [];
        if (Array.isArray(list)) setGames(list);
      })
      .catch(() => {});
  }, []);

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  const tagError =
    tag.length > 0 && (tag.length < 3 || tag.length > 5)
      ? "El tag debe tener entre 3 y 5 caracteres"
      : undefined;

  const canSubmit = !!name.trim() && tag.length >= 3 && tag.length <= 5 && !loading;

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.danger("El nombre del clan es requerido");
      return;
    }
    if (tag.length < 3 || tag.length > 5) {
      toast.danger("El tag debe tener entre 3 y 5 caracteres");
      return;
    }
    if (!session?.accessToken) return;

    const payload: CreateClanRequest = {
      name: name.trim(),
      tag: tag.trim().toUpperCase(),
      description: description.trim() || undefined,
      game_id: gameId || undefined,
      city: city.trim() || undefined,
      logo_url: logoUrl.trim() || undefined,
      banner_url: bannerUrl.trim() || undefined,
      recruit_min_elo: recruitMinElo ? parseInt(recruitMinElo) : undefined,
      max_members: maxMembers ? parseInt(maxMembers) : undefined,
      is_recruiting: isRecruiting,
    };

    setLoading(true);
    try {
      const res = await createClan(payload, session.accessToken);
      toast.success("Clan creado exitosamente");
      const clanId = res?.data?.clan?.id ?? res?.clan?.id;
      if (clanId) {
        router.push(`/clanes/${clanId}`);
      } else {
        router.push("/comunidades?type=clanes");
      }
    } catch {
      toast.danger("No se pudo crear el clan. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div>
        <Chip color="accent" variant="soft" size="sm" className="mb-3 px-3">
          Clanes
        </Chip>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">
          Crear Clan
        </h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          Crea tu clan y recluta jugadores.
        </p>
      </div>

      <Card className="surface-card rounded-2xl overflow-hidden">
        <Card.Content className="p-5 space-y-4">
          {/* Name */}
          <TextField className="space-y-1 flex flex-col">
            <Label className="text-xs text-[var(--muted)]">
              Nombre del clan *
            </Label>
            <Input
              placeholder="Ej: Los Dragones"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
            />
          </TextField>

          {/* Tag */}
          <TextField
            className="space-y-1 flex flex-col"
            isInvalid={!!tagError}
          >
            <Label className="text-xs text-[var(--muted)]">Tag * (3-5 caracteres)</Label>
            <Input
              placeholder="Ej: DRG"
              value={tag}
              onChange={(e) => setTag(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
              maxLength={5}
            />
            {tagError ? (
              <p className="text-[11px] text-red-500 mt-1">{tagError}</p>
            ) : (
              <p className="text-[11px] text-[var(--muted)] mt-1">
                Se mostrara como [{tag || "TAG"}]
              </p>
            )}
          </TextField>

          {/* Game selector */}
          <Select
            selectedKey={gameId || null}
            onSelectionChange={(key) => setGameId(String(key || ""))}
          >
            <Label>Juego (opcional)</Label>
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

          {/* Description */}
          <TextField className="space-y-1 flex flex-col">
            <Label className="text-xs text-[var(--muted)]">
              Descripcion (opcional)
            </Label>
            <TextArea
              placeholder="Describe tu clan..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </TextField>

          {/* City */}
          <TextField className="space-y-1 flex flex-col">
            <Label className="text-xs text-[var(--muted)]">
              Ciudad (opcional)
            </Label>
            <Input
              placeholder="Ej: Santiago"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </TextField>

          {/* Logo URL */}
          <TextField className="space-y-1 flex flex-col">
            <Label className="text-xs text-[var(--muted)]">
              URL Logo (opcional)
            </Label>
            <Input
              placeholder="https://..."
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
            />
          </TextField>

          {/* Banner URL */}
          <TextField className="space-y-1 flex flex-col">
            <Label className="text-xs text-[var(--muted)]">
              URL Banner (opcional)
            </Label>
            <Input
              placeholder="https://..."
              value={bannerUrl}
              onChange={(e) => setBannerUrl(e.target.value)}
            />
          </TextField>

          {/* ELO minimo */}
          <TextField className="space-y-1 flex flex-col">
            <Label className="text-xs text-[var(--muted)]">
              ELO minimo para unirse (opcional)
            </Label>
            <Input
              type="number"
              placeholder="Ej: 1200"
              value={recruitMinElo}
              onChange={(e) => setRecruitMinElo(e.target.value)}
            />
          </TextField>

          {/* Max members */}
          <TextField className="space-y-1 flex flex-col">
            <Label className="text-xs text-[var(--muted)]">
              Maximo de miembros (opcional, default 50)
            </Label>
            <Input
              type="number"
              placeholder="50"
              value={maxMembers}
              onChange={(e) => setMaxMembers(e.target.value)}
            />
          </TextField>

          {/* Recruiting toggle */}
          <div className="flex items-center justify-between glass-sm p-4 rounded-xl">
            <span className="text-sm font-medium text-[var(--foreground)]">
              Reclutando miembros
            </span>
            <Button
              type="button"
              size="sm"
              variant={isRecruiting ? "primary" : "secondary"}
              onPress={() => setIsRecruiting(!isRecruiting)}
              className="rounded-full px-4"
            >
              {isRecruiting ? "Activo" : "Inactivo"}
            </Button>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              className="flex-1 font-semibold"
              style={{
                background: "var(--accent)",
                color: "var(--accent-foreground)",
              }}
              onPress={handleSubmit}
              isPending={loading}
              isDisabled={!canSubmit}
            >
              Crear Clan
            </Button>
            <Button
              type="button"
              variant="tertiary"
              onPress={() => router.back()}
            >
              Cancelar
            </Button>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
}
