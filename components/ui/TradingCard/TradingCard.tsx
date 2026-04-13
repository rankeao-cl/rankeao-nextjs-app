"use client";

import { useState } from "react";
import Image from "next/image";

interface TradingCardProps {
  /** URL of the front face */
  frontUrl: string;
  /** URL of the back face (DFC cards). If provided, enables 3D flip. */
  backUrl?: string | null;
  alt?: string;
  sizes?: string;
  priority?: boolean;
  /** Show ambient glow behind the card. Default false. */
  showGlow?: boolean;
  /**
   * Show the built-in Girar button below the card for DFC.
   * Ignored when `flipped` is provided (controlled mode).
   * Default true.
   */
  showFlipButton?: boolean;
  /**
   * Controlled flip state. When provided the component is fully controlled —
   * internal state is ignored and no built-in flip button is rendered.
   */
  flipped?: boolean;
  /** Width percentage of parent for the card (default 100%). Used for glow sizing. */
  cardWidthPct?: number;
  /** Extra class for outer wrapper */
  className?: string;
}

function FlipIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </svg>
  );
}

export default function TradingCard({
  frontUrl,
  backUrl,
  alt = "",
  sizes = "300px",
  priority = false,
  showGlow = false,
  showFlipButton = true,
  flipped: controlledFlipped,
  cardWidthPct = 100,
  className = "",
}: TradingCardProps) {
  const [internalFlipped, setInternalFlipped] = useState(false);

  // Controlled mode: use prop. Uncontrolled: use internal state.
  const isControlled = controlledFlipped !== undefined;
  const flipped = isControlled ? controlledFlipped : internalFlipped;
  const isDFC = !!backUrl;

  const widthStr = `${cardWidthPct}%`;

  return (
    <div className={className} style={{ position: "relative" }}>
      {/* Ambient glow */}
      {showGlow && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            width: widthStr,
            aspectRatio: "63 / 88",
            zIndex: 0,
            pointerEvents: "none",
          }}
        >
          <div style={{
            position: "absolute", inset: 0,
            opacity: (isDFC && flipped) ? 0 : 1,
            transition: "opacity 0.55s cubic-bezier(0.4, 0, 0.2, 1)",
          }}>
            <Image src={frontUrl} alt="" fill className="object-cover"
              style={{ filter: "blur(44px) saturate(2.2) brightness(0.38)", transform: "scale(1.15)" }}
              sizes="500px"
            />
          </div>
          {isDFC && backUrl && (
            <div style={{
              position: "absolute", inset: 0,
              opacity: flipped ? 1 : 0,
              transition: "opacity 0.55s cubic-bezier(0.4, 0, 0.2, 1)",
            }}>
              <Image src={backUrl} alt="" fill className="object-cover"
                style={{ filter: "blur(44px) saturate(2.2) brightness(0.38)", transform: "scale(1.15)" }}
                sizes="500px"
              />
            </div>
          )}
        </div>
      )}

      {/* Card with 3D flip */}
      <div style={{ position: "relative", zIndex: 1, width: widthStr, margin: "0 auto", perspective: "1400px" }}>
        <div
          style={{
            width: "100%",
            aspectRatio: "63 / 88",
            transformStyle: "preserve-3d",
            transition: "transform 0.55s cubic-bezier(0.4, 0, 0.2, 1)",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
            borderRadius: "4.75% / 3.5%",
            boxShadow: showGlow
              ? "0 28px 80px rgba(0,0,0,0.92), 0 8px 26px rgba(0,0,0,0.6)"
              : "rgba(0,0,0,0.5) 1px 1px 8px 0px",
          }}
        >
          {/* Front */}
          <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", borderRadius: "4.75% / 3.5%", overflow: "hidden" }}>
            <Image src={frontUrl} alt={alt} fill className="object-cover" sizes={sizes} priority={priority} />
          </div>

          {/* Back (DFC) */}
          {isDFC && backUrl && (
            <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg)", borderRadius: "4.75% / 3.5%", overflow: "hidden" }}>
              <Image src={backUrl} alt={`${alt} — reverso`} fill className="object-cover" sizes={sizes} />
            </div>
          )}
        </div>
      </div>

      {/* Built-in flip button — only in uncontrolled mode with showFlipButton */}
      {isDFC && !isControlled && showFlipButton && (
        <div style={{ position: "relative", zIndex: 2, display: "flex", justifyContent: "center", marginTop: 12 }}>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              e.nativeEvent.stopImmediatePropagation();
              setInternalFlipped(f => !f);
            }}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              fontSize: 11, fontWeight: 700,
              color: "rgba(255,255,255,0.82)",
              background: "rgba(255,255,255,0.06)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.15)",
              padding: "5px 12px", borderRadius: 999,
              cursor: "pointer",
            }}
          >
            <FlipIcon />
            {flipped ? "Ver frente" : "Girar"}
          </button>
        </div>
      )}
    </div>
  );
}
