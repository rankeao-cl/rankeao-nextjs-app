"use client";

import { useRouter } from "next/navigation";
import LifeCounterSetup from "@/features/duels/LifeCounter/LifeCounterSetup";

interface LifeCounterSetupClientProps {
    linkedDuelId: string | null;
}

export default function LifeCounterSetupClient({ linkedDuelId }: LifeCounterSetupClientProps) {
    const router = useRouter();

    const handleSessionCreated = (sessionId: string) => {
        router.push(`/duels/session/${sessionId}`);
    };

    return (
        <LifeCounterSetup
            linkedDuelId={linkedDuelId}
            onSessionCreated={handleSessionCreated}
        />
    );
}
