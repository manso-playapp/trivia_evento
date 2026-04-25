"use client";

import { useEffect, useState } from "react";

const CONFETTI_PARTICLES = [
  { left: "6%", drift: "-14px", delay: "0ms", duration: "1250ms", color: "var(--selection-green)" },
  { left: "13%", drift: "10px", delay: "120ms", duration: "1150ms", color: "var(--accent)" },
  { left: "20%", drift: "-8px", delay: "240ms", duration: "1300ms", color: "var(--selection-green)" },
  { left: "27%", drift: "12px", delay: "80ms", duration: "1200ms", color: "var(--warning)" },
  { left: "34%", drift: "-12px", delay: "200ms", duration: "1180ms", color: "var(--selection-green)" },
  { left: "42%", drift: "9px", delay: "300ms", duration: "1280ms", color: "var(--accent)" },
  { left: "50%", drift: "-9px", delay: "100ms", duration: "1220ms", color: "var(--selection-green)" },
  { left: "58%", drift: "11px", delay: "260ms", duration: "1320ms", color: "var(--warning)" },
  { left: "66%", drift: "-10px", delay: "140ms", duration: "1170ms", color: "var(--selection-green)" },
  { left: "74%", drift: "10px", delay: "320ms", duration: "1290ms", color: "var(--accent)" },
  { left: "82%", drift: "-11px", delay: "180ms", duration: "1210ms", color: "var(--selection-green)" },
  { left: "90%", drift: "9px", delay: "40ms", duration: "1260ms", color: "var(--warning)" },
];

const FULL_SCREEN_PARTICLES = Array.from({ length: 5 }).flatMap((_, groupIndex) =>
  CONFETTI_PARTICLES.map((particle, particleIndex) => ({
    ...particle,
    delay: `${groupIndex * 360 + particleIndex * 35}ms`,
    duration: `${3600 + ((groupIndex + particleIndex) % 5) * 420}ms`,
    drift: `${Number.parseInt(particle.drift, 10) * (4 + groupIndex)}px`,
  }))
);

type SuccessConfettiProps = {
  durationMs?: number;
  fullScreen?: boolean;
};

export function SuccessConfetti({
  durationMs,
  fullScreen = false,
}: SuccessConfettiProps) {
  const [visible, setVisible] = useState(true);
  const particles = fullScreen ? FULL_SCREEN_PARTICLES : CONFETTI_PARTICLES;

  useEffect(() => {
    if (!durationMs) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setVisible(false);
    }, durationMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [durationMs]);

  if (!visible) {
    return null;
  }

  return (
    <div
      className={`pointer-events-none ${
        fullScreen
          ? "fixed inset-0 z-50 overflow-hidden"
          : "absolute inset-0 overflow-hidden"
      }`}
      aria-hidden="true"
    >
      {particles.map((particle, index) => (
        <span
          key={`${particle.left}-${index}`}
          className={`confetti-piece absolute -top-2 block rounded-[1px] ${
            fullScreen ? "h-4 w-2" : "h-2 w-1"
          }`}
          style={{
            left: particle.left,
            backgroundColor: particle.color,
            animationDelay: particle.delay,
            animationDuration: particle.duration,
            ["--confetti-drift" as string]: particle.drift,
            ["--confetti-fall-distance" as string]: fullScreen ? "110vh" : "96px",
          }}
        />
      ))}
    </div>
  );
}
