"use client";

import { useState } from "react";

const TABS = [
  { key: "todo", label: "Todo" },
  { key: "torneos", label: "Torneos" },
  { key: "ventas", label: "Ventas" },
];

export default function FeedTabs() {
  const [active, setActive] = useState("todo");

  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          onClick={() => setActive(tab.key)}
          className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer ${
            active === tab.key
              ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
              : "bg-[var(--surface-secondary)] text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
