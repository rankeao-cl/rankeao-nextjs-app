"use client";

type FeedFilter = "todo" | "torneos" | "ventas" | "posts";

const FEED_TABS: { key: FeedFilter; label: string }[] = [
  { key: "todo", label: "Todo" },
  { key: "torneos", label: "Torneos" },
  { key: "ventas", label: "Ventas" },
  { key: "posts", label: "Posts" },
];

export default function FeedTabs({
  active,
  onChange,
}: {
  active: FeedFilter;
  onChange: (tab: FeedFilter) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        gap: 8,
        paddingTop: 12,
        paddingBottom: 12,
        paddingLeft: 4,
        paddingRight: 4,
        overflowX: "auto",
      }}
    >
      {FEED_TABS.map((tab) => {
        const isActive = active === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            style={{
              paddingLeft: 16,
              paddingRight: 16,
              paddingTop: 8,
              paddingBottom: 8,
              borderRadius: 999,
              backgroundColor: isActive ? "#F2F2F2" : "#1A1A1E",
              border: isActive
                ? "1px solid transparent"
                : "1px solid rgba(255,255,255,0.06)",
              color: isActive ? "#000000" : "#888891",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap" as const,
              outline: "none",
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
