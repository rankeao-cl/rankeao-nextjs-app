"use client";

import { useUIStore } from "@/lib/stores/ui-store";

export default function OpenCreateListingAction() {
  const openCreateListing = useUIStore((s) => s.openCreateListing);

  return (
    <button
      type="button"
      onClick={openCreateListing}
      className="shrink-0 cursor-pointer border-none"
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: "var(--accent)",
        borderRadius: 12,
        paddingLeft: 14,
        paddingRight: 14,
        paddingTop: 8,
        paddingBottom: 8,
        marginLeft: 12,
        alignSelf: "center",
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-foreground)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
      <span style={{ color: "var(--accent-foreground)", fontSize: 12, fontWeight: 700 }}>Vender</span>
    </button>
  );
}
