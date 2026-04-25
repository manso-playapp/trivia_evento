"use client";

import { useEffect, useState } from "react";
import { Timer } from "lucide-react";

import type { RoundStatus } from "@/types";

type TimerDisplayProps = {
  roundEndsAt: string | null;
  roundDurationSeconds: number;
  roundStatus: RoundStatus;
  variant?: "panel" | "header" | "sidebar";
};

const getRemainingSeconds = (
  roundEndsAt: string | null,
  roundDurationSeconds: number,
  roundStatus: RoundStatus
) => {
  if (roundStatus === "question_revealed" || roundStatus === "idle") {
    return roundDurationSeconds;
  }

  if (!roundEndsAt) {
    return 0;
  }

  return Math.max(
    0,
    Math.ceil((new Date(roundEndsAt).getTime() - Date.now()) / 1000)
  );
};

export function TimerDisplay({
  roundEndsAt,
  roundDurationSeconds,
  roundStatus,
  variant = "panel",
}: TimerDisplayProps) {
  const [seconds, setSeconds] = useState(() =>
    getRemainingSeconds(roundEndsAt, roundDurationSeconds, roundStatus)
  );

  useEffect(() => {
    const updateTime = () => {
      setSeconds(
        getRemainingSeconds(roundEndsAt, roundDurationSeconds, roundStatus)
      );
    };

    updateTime();

    const intervalId = window.setInterval(updateTime, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [roundDurationSeconds, roundEndsAt, roundStatus]);

  const progress = Math.max(
    0,
    Math.min(100, (seconds / roundDurationSeconds) * 100)
  );
  const timerToneClassName =
    seconds <= 5 && roundStatus === "round_active"
      ? "text-danger"
      : seconds <= 10 && roundStatus === "round_active"
        ? "text-warning"
        : "text-foreground";
  const headerContainerToneClassName =
    seconds <= 5 && roundStatus === "round_active"
      ? "bg-danger/12"
      : seconds <= 10 && roundStatus === "round_active"
        ? "bg-warning/12"
        : "bg-surface/88";
  const timerRingColor =
    seconds <= 5 && roundStatus === "round_active"
      ? "var(--danger)"
      : seconds <= 10 && roundStatus === "round_active"
        ? "var(--warning)"
        : "var(--accent)";
  const timerRingStyle = {
    background: `conic-gradient(${timerRingColor} ${progress}%, color-mix(in oklab, var(--muted) 68%, black) ${progress}% 100%)`,
    filter: `drop-shadow(0 0 12px color-mix(in oklab, ${timerRingColor} 72%, transparent))`,
  };
  const isFinalCountdown = seconds <= 5 && roundStatus === "round_active";

  if (variant === "header") {
    return (
      <div
        className={`px-4 py-2.5 shadow-[0_10px_20px_rgba(0,0,0,0.28)] sm:px-5 ${headerContainerToneClassName}`}
      >
        <div className="flex items-center justify-between gap-6">
          <div>
            <p className="broadcast-label mb-1.5 flex items-center gap-2">
              <Timer className="size-3.5 text-accent" />
              Countdown
            </p>
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
              Tiempo de ronda
            </p>
          </div>
          <div className="relative size-[3.85rem] shrink-0">
            <div className="absolute inset-0 rounded-full" style={timerRingStyle} />
            <div
              className={`absolute inset-[0.3rem] flex items-center justify-center rounded-full shadow-[inset_0_1px_8px_rgba(0,0,0,0.5)] ${
                isFinalCountdown
                  ? "bg-danger/35 timer-final-pulse"
                  : "bg-background/95"
              }`}
            >
              <div
                className={`text-[1.78rem] font-semibold leading-none tracking-[-0.04em] tabular-nums ${timerToneClassName}`}
              >
                {seconds}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === "sidebar") {
    return (
      <div className="w-full">
        <div className="mb-1.5 flex items-center justify-between gap-3">
          <p className="broadcast-label">Tiempo</p>
          <p
            className={`text-[3.15rem] font-semibold leading-none tracking-[-0.05em] tabular-nums ${timerToneClassName}`}
          >
            {seconds}
          </p>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-background/70">
          <div
            className="h-full bg-accent transition-[width] duration-500"
            style={{
              width: `${progress}%`,
              filter: "drop-shadow(0 0 12px color-mix(in oklab, var(--accent) 72%, transparent))",
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="broadcast-panel relative overflow-hidden px-5 py-5 text-center sm:px-6 sm:py-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/8" />
      <p className="broadcast-label mb-3 flex items-center justify-center gap-2">
        <Timer className="size-3.5 text-accent" />
        Timer
      </p>
      <div
        className={`text-6xl font-semibold leading-none tracking-[-0.05em] sm:text-8xl ${timerToneClassName}`}
      >
        {seconds}
      </div>
      <p className="mt-3 text-sm text-muted-foreground">segundos restantes</p>
      <div className="mt-5 h-2 overflow-hidden rounded-full bg-background/70">
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
