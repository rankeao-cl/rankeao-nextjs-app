"use client";

import { useState } from "react";
import { Button } from "@heroui/react";
import { useAuth } from "@/context/AuthContext";
import { applyToClan, leaveClan } from "@/lib/api/clans";
import type { ClanMember } from "@/lib/types/clan";

interface Props {
  clanId: string;
  myMembership?: ClanMember;
}

export default function ClanDetailClient({ clanId, myMembership }: Props) {
  const { session, status } = useAuth();
  const isAuth = status === "authenticated";

  const [loading, setLoading] = useState(false);
  const [applied, setApplied] = useState(false);
  const [left, setLeft] = useState(false);

  if (!isAuth) return null;

  const isMember = myMembership && !left;
  const isLeader = myMembership?.role === "LEADER";

  const handleApply = async () => {
    setLoading(true);
    try {
      await applyToClan(clanId, undefined, session?.accessToken);
      setApplied(true);
    } catch {
      // silent
    }
    setLoading(false);
  };

  const handleLeave = async () => {
    if (!confirm("¿Estás seguro de que quieres abandonar el clan?")) return;
    setLoading(true);
    try {
      await leaveClan(clanId, session?.accessToken);
      setLeft(true);
    } catch {
      // silent
    }
    setLoading(false);
  };

  return (
    <div className="flex gap-3">
      {isMember ? (
        <>
          {isLeader && (
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full font-semibold"
              onPress={() => window.location.href = `/clanes/${clanId}/manage`}
            >
              Administrar
            </Button>
          )}
          {!isLeader && (
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full font-semibold text-red-500 hover:bg-red-500/10"
              onPress={handleLeave}
              isPending={loading}
            >
              Abandonar clan
            </Button>
          )}
        </>
      ) : applied ? (
        <Button
          variant="ghost"
          size="sm"
          className="rounded-full font-semibold"
          isDisabled
        >
          Solicitud enviada ✓
        </Button>
      ) : (
        <Button
          variant="primary"
          size="sm"
          className="rounded-full font-semibold bg-[var(--accent)] text-white"
          onPress={handleApply}
          isPending={loading}
        >
          Solicitar unirse
        </Button>
      )}
    </div>
  );
}
