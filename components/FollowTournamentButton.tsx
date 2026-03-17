"use client";

import { useState } from "react";
import { Button } from "@heroui/react";
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
    const [loading, setLoading] = useState(false);

    async function handleToggle() {
        setLoading(true);
        // TODO: wire to API when endpoint exists
        // For now, toggle local state with a small delay to simulate API call
        await new Promise((r) => setTimeout(r, 300));
        setFollowing((prev) => !prev);
        setLoading(false);
    }

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
