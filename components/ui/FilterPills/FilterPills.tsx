import Link from "next/link";

interface FilterPill {
  key: string;
  label: string;
  count?: number;
  href?: string;
}

interface FilterPillsProps {
  items: FilterPill[];
  activeKey: string;
  onChange?: (key: string) => void;
}

export type { FilterPill, FilterPillsProps };

export default function FilterPills({ items, activeKey, onChange }: FilterPillsProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
      {items.map((item) => {
        const isActive = item.key === activeKey;
        const style: React.CSSProperties = {
          padding: "8px 16px",
          borderRadius: 999,
          fontSize: 13,
          fontWeight: 600,
          whiteSpace: "nowrap",
          textDecoration: "none",
          backgroundColor: isActive ? "var(--foreground)" : "var(--surface-solid)",
          color: isActive ? "var(--background)" : "var(--muted)",
          border: isActive ? "1px solid transparent" : "1px solid var(--border)",
          flexShrink: 0,
        };

        if (item.href) {
          return (
            <Link key={item.key} href={item.href} style={style}>
              {item.label}
              {item.count !== undefined && (
                <span style={{ marginLeft: 4, opacity: 0.7 }}>{item.count}</span>
              )}
            </Link>
          );
        }

        return (
          <button
            key={item.key}
            onClick={() => onChange?.(item.key)}
            type="button"
            style={{ ...style, cursor: "pointer" }}
          >
            {item.label}
            {item.count !== undefined && (
              <span style={{ marginLeft: 4, opacity: 0.7 }}>{item.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
