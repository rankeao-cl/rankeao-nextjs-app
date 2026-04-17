"use client";

import NewDeckPage from "@/app/(app)/decks/new/page";
import { useUIStore } from "@/lib/stores/ui-store";

export default function CreateDeckModal() {
    const isOpen = useUIStore((s) => s.createDeckModalOpen);
    const closeCreateDeck = useUIStore((s) => s.closeCreateDeck);

    if (!isOpen) return null;

    return <NewDeckPage onCloseOverride={closeCreateDeck} />;
}
