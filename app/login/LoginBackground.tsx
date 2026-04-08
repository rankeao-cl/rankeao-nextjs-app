"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

const BACKGROUNDS = [
  "/login-bg-1.webp", // Liliana Eldritch Moon (playmat edit)
  "/login-bg-2.webp", // Liliana Defiant Necromancer
  "/login-bg-3.webp", // Anguished Unmaking (Innistrad)
  "/login-bg-4.webp", // Chandra in the Mountain
  "/login-bg-5.webp", // Demon
];

const EMBER_COUNT = 18;

const embers = Array.from({ length: EMBER_COUNT }, (_, i) => ({
  id: i,
  size: 2 + Math.random() * 4,
  left: 10 + Math.random() * 80,
  delay: Math.random() * 12,
  duration: 5 + Math.random() * 8,
  drift: -40 + Math.random() * 80,
  glow: 0.4 + Math.random() * 0.6,
}));

export default function LoginBackground() {
  const [imgError, setImgError] = useState(false);
  const bg = useMemo(
    () => BACKGROUNDS[Math.floor(Math.random() * BACKGROUNDS.length)],
    [],
  );

  return (
    <div className="login-bg" aria-hidden="true">
      {/* Static background image — random on each load */}
      <div className="login-bg__image">
        {!imgError && (
          <Image
            src={bg}
            alt=""
            fill
            priority
            sizes="100vw"
            quality={100}
            unoptimized
            className="object-cover"
            onError={() => setImgError(true)}
          />
        )}
      </div>

      {/* Dark fade from bottom */}
      <div className="login-bg__vignette" />

      {/* Fire embers / ash particles floating up */}
      {embers.map((e) => (
        <span
          key={e.id}
          className="login-ember"
          style={{
            width: e.size,
            height: e.size,
            left: `${e.left}%`,
            animationDelay: `${e.delay}s`,
            animationDuration: `${e.duration}s`,
            "--drift": `${e.drift}px`,
            "--glow": e.glow,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
