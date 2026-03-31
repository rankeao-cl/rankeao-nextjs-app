"use client";

import { useState } from "react";
import { Button, toast } from "@heroui/react";
import { Bell, BellDot } from "@gravity-ui/icons";

interface FollowTournamentButtonProps {
    tournamentId: string;
    isFollowing?: boolean;
}

export default function FollowTournamentButton({
    tournamentId,
    isFollowing: initialFollowing = false,
}: FollowTournamentButtonProps) {
    const [following, setFollowing] = useState(initialFollowing);
    async function handleToggle() {
        toast.warning("Proximamente", { description: "Esta funcion estara disponible pronto." });
    }

    return (
        <Button
            size="sm"
            variant={following ? "secondary" : "tertiary"}
            isDisabled={false}
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
