"use client";

import NewListingPage from "@/app/(app)/marketplace/new/page";
import { useUIStore } from "@/lib/stores/ui-store";

export default function CreateListingModal() {
    const isOpen = useUIStore((s) => s.createListingModalOpen);
    const closeCreateListing = useUIStore((s) => s.closeCreateListing);

    if (!isOpen) return null;

    return <NewListingPage onCloseOverride={closeCreateListing} />;
}
