"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getClan, applyToClan, leaveClan } from "@/lib/api/clans";
import type { ClanMember } from "@/lib/types/clan";
import Link from "next/link";
import { Comment } from "@gravity-ui/icons";

interface Props {
  clanId: string;
  myMembership?: ClanMember;
  members?: ClanMember[];
}

export default function ClanDetailClient({ clanId, myMembership: serverMembership, members: serverMembers }: Props) {
  const { session, status } = useAuth();
  const router = useRouter();
  const isAuth = status === "authenticated";

  const [loading, setLoading] = useState(false);
  const [applied, setApplied] = useState(false);
  const [left, setLeft] = useState(false);
  const [myMembership, setMyMembership] = useState<ClanMember | undefined>(serverMembership);
  const [checked, setChecked] = useState(!!serverMembership);

  // Client-side: check if user is a member by fetching clan with token or matching members
  useEffect(() => {
    if (!isAuth || !session?.username || checked) return;

    // First try: match from server members list
    if (serverMembers && serverMembers.length > 0) {
      const match = serverMembers.find(
        (m) => m.username === session.username || m.user_id === (session as any)?.user_id
      );
      if (match) {
        setMyMembership(match);
        setChecked(true);
        return;
      }
    }

    // Second try: fetch clan with token to get my_membership
    getClan(clanId, session?.accessToken)
      .then((res: any) => {
        const clan = res?.data ?? res?.clan ?? res;
        if (clan?.my_membership) {
          setMyMembership(clan.my_membership);
        } else if (clan?.members) {
          const match = clan.members.find(
            (m: any) => m.username === session.username || m.user_id === (session as any)?.user_id
          );
          if (match) setMyMembership(match);
        }
      })
      .catch(() => {})
      .finally(() => setChecked(true));
  }, [isAuth, session, clanId, checked, serverMembers]);

  if (!isAuth) return null;

  const isMember = myMembership && !left;
  const isLeader = myMembership?.role === "LEADER";
  const isOfficer = myMembership?.role === "OFFICER";

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
    <div style={{ display: "flex", gap: 8 }}>
      {isMember ? (
        <>
          {(isLeader || isOfficer) && (
            <Link
              href={`/clanes/${clanId}/manage`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "8px 16px",
                borderRadius: 999,
                backgroundColor: "var(--surface)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
                fontSize: 13,
                fontWeight: 600,
                textDecoration: "none",
                cursor: "pointer",
              }}
            >
              Administrar
            </Link>
          )}
          <button
            onClick={() => router.push("/chat?filter=clanes")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              borderRadius: 999,
              backgroundColor: "rgba(59,130,246,0.1)",
              border: "1px solid rgba(59,130,246,0.25)",
              color: "var(--accent)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <Comment style={{ width: 14, height: 14 }} />
            Chat del Clan
          </button>
          {!isLeader && (
            <button
              onClick={handleLeave}
              disabled={loading}
              style={{
                padding: "8px 16px",
                borderRadius: 999,
                backgroundColor: "transparent",
                border: "1px solid rgba(239,68,68,0.3)",
                color: "var(--danger)",
                fontSize: 13,
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? "Saliendo..." : "Abandonar clan"}
            </button>
          )}
        </>
      ) : applied ? (
        <span
          style={{
            padding: "8px 16px",
            borderRadius: 999,
            backgroundColor: "var(--surface)",
            color: "var(--muted)",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          Solicitud enviada ✓
        </span>
      ) : (
        <button
          onClick={handleApply}
          disabled={loading}
          style={{
            padding: "8px 16px",
            borderRadius: 999,
            backgroundColor: "var(--accent)",
            border: "none",
            color: "#FFFFFF",
            fontSize: 13,
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "Enviando..." : "Solicitar unirse"}
        </button>
      )}
    </div>
  );
}
