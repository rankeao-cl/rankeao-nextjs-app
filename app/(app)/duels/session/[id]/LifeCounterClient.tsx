"use client";

import { useEffect } from "react";
import LifeCounter from "@/features/duels/LifeCounter/LifeCounter";

interface LifeCounterClientProps {
    duelId: string;
    gameNumber: number;
    sessionId: string;
}

export default function LifeCounterClient({ duelId, gameNumber }: LifeCounterClientProps) {
    // Hide the document scrollbar while life counter is active
    useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, []);

    return (
        <LifeCounter
            duelId={duelId}
            gameNumber={gameNumber}
            initialSession={null}
        />
    );
}
