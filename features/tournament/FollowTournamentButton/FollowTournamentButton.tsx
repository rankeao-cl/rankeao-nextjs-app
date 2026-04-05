"use client";

import { useState, useCallback } from "react";
import { Button } from "@heroui/react/button";
import { toast } from "@heroui/react/toast";

import { Bell, BellDot } from "@gravity-ui/icons";
import { useAuth } from "@/lib/hooks/use-auth";
import { followTournament, unfollowTournament } from "@/lib/api/tournaments";

interface FollowTournamentButtonProps {
    tournamentId: string;
    isFollowing?: boolean;
}

export default function FollowTournamentButton({
    tournamentId,
    isFollowing: initialFollowing = false,
}: FollowTournamentButtonProps) {
    const { status } = useAuth();
    const isAuth = status === "authenticated";
    const [following, setFollowing] = useState(initialFollowing);
    const [loading, setLoading] = useState(false);

    const handleToggle = useCallback(async () => {
        if (!isAuth) {
            toast.warning("Inicia sesión para seguir torneos");
            return;
        }
        const wasFollowing = following;
        setFollowing(!wasFollowing);
        setLoading(true);
        try {
            if (wasFollowing) {
                await unfollowTournament(tournamentId);
            } else {
                await followTournament(tournamentId);
            }
        } catch {
            setFollowing(wasFollowing);
            toast.danger("No se pudo actualizar");
        }
        setLoading(false);
    }, [isAuth, following, tournamentId]);

    return (
        <Button
            size="sm"
            variant={following ? "secondary" : "tertiary"}
            isDisabled={loading}
            onPress={handleToggle}
            className="font-semibold gap-1.5"
            style={
                following
                    ? {
                          background: "var(--accent-soft, rgba(var(--accent-rgb, 99 102 241), 0.1))",
                          color: "var(--accent)",
                          borderColor: "var(--accent)",
                      }
                    : undefined
            }
        >
            {following ? (
                <>
                    <BellDot className="size-3.5" />
                    Siguiendo
                </>
            ) : (
                <>
                    <Bell className="size-3.5" />
                    Seguir
                </>
            )}
        </Button>
    );
}
