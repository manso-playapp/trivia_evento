"use client";

import { useEffect, useState } from "react";
import { Timer } from "lucide-react";

import type { RoundStatus } from "@/types";

type TimerDisplayProps = {
  roundEndsAt: string | null;
  roundDurationSeconds: number;
  roundStatus: RoundStatus;
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
