"use client";

type ProgressBarsProps = {
  total: number;
  activeIndex: number;
  progress: number;
};

export default function ProgressBars({ total, activeIndex, progress }: ProgressBarsProps) {
  return (
    <div style={{ position: "absolute", top: 10, left: 10, right: 10, zIndex: 3 }}>
      <div style={{ display: "flex", gap: 4 }}>
        {Array.from({ length: total }).map((_, idx) => {
          const fill = idx < activeIndex ? 100 : idx === activeIndex ? Math.max(0, Math.min(100, progress)) : 0;
          return (
            <div
              key={`progress-${idx}`}
              role="progressbar"
              aria-valuenow={Math.round(fill)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Historia ${idx + 1} de ${total}`}
              style={{
                flex: 1,
                height: 3,
                borderRadius: 999,
                background: "rgba(255,255,255,0.25)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${fill}%`,
                  background: "white",
                  transition: "width 80ms linear",
                }}
              />
            </div>
          );
        })}
      </div>
      {total > 1 && (
        <div
          aria-hidden="true"
          style={{
            marginTop: 4,
            textAlign: "right",
            color: "rgba(255,255,255,0.72)",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: 0.3,
            textShadow: "0 1px 3px rgba(0,0,0,0.6)",
          }}
        >
          {activeIndex + 1} / {total}
        </div>
      )}
    </div>
  );
}
