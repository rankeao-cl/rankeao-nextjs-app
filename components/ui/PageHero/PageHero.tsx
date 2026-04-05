import type { ReactNode } from "react";

interface PageHeroProps {
  badge: string;
  title: string;
  subtitle: string;
  action?: ReactNode;
}

export default function PageHero({ badge, title, subtitle, action }: PageHeroProps) {
  return (
    <div className="mx-4 lg:mx-6 mt-3 mb-[14px]">
      <div
        style={{
          backgroundColor: "var(--surface-solid)",
          border: "1px solid var(--border)",
          borderRadius: 16,
          padding: 18,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          minHeight: 120,
          overflow: "hidden",
        }}
      >
        <div style={{ flex: 1 }}>
          {/* Badge */}
          <span
            style={{
              display: "inline-block",
              backgroundColor: "var(--surface)",
              alignSelf: "flex-start",
              paddingLeft: 10,
              paddingRight: 10,
              paddingTop: 4,
              paddingBottom: 4,
              borderRadius: 999,
              marginBottom: 8,
              color: "var(--muted)",
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            {badge}
          </span>
          <h1
            style={{
              color: "var(--foreground)",
              fontSize: 22,
              fontWeight: 800,
              margin: 0,
              marginBottom: 4,
            }}
          >
            {title}
          </h1>
          <p
            style={{
              color: "var(--muted)",
              fontSize: 13,
              lineHeight: "18px",
              margin: 0,
            }}
          >
            {subtitle}
          </p>
        </div>
        {action}
      </div>
    </div>
  );
}
