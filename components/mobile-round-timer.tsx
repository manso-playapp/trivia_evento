"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { playCountdownTickSound, unlockScreenSounds } from "@/lib/screen-sounds";
import type { RoundStatus } from "@/types";

type MobileRoundTimerProps = {
  roundEndsAt: string | null;
  roundDurationSeconds: number;
  roundStatus: RoundStatus;
  currentStep: number;
  totalSteps: number;
  size?: "mobile" | "screen";
};

const getInitialSeconds = (
  roundDurationSeconds: number,
  roundStatus: RoundStatus
) =>
  roundStatus === "idle" ||
  roundStatus === "question_revealed" ||
  roundStatus === "round_active"
    ? roundDurationSeconds
    : 0;

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

export function MobileRoundTimer({
  roundEndsAt,
  roundDurationSeconds,
  roundStatus,
  currentStep,
  totalSteps,
  size = "mobile",
}: MobileRoundTimerProps) {
  const [seconds, setSeconds] = useState(() =>
    getInitialSeconds(roundDurationSeconds, roundStatus)
  );
  const lastTickedSecondRef = useRef<number | null>(null);

  useEffect(() => {
    const unlock = () => {
      unlockScreenSounds();
    };

    window.addEventListener("pointerdown", unlock);
    window.addEventListener("touchstart", unlock);
    window.addEventListener("keydown", unlock);

    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("touchstart", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

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

  useEffect(() => {
    if (roundStatus !== "round_active" || seconds > 5 || seconds <= 0) {
      lastTickedSecondRef.current = null;
      return;
    }

    if (lastTickedSecondRef.current === seconds) {
      return;
    }

    lastTickedSecondRef.current = seconds;
    playCountdownTickSound();
  }, [roundStatus, seconds]);

  const progress = Math.max(
    0,
    Math.min(100, (seconds / roundDurationSeconds) * 100)
  );

  const ringColor = useMemo(() => {
    if (seconds <= 5 && roundStatus === "round_active") {
      return "var(--danger)";
    }
    if (seconds <= 10 && roundStatus === "round_active") {
      return "var(--warning)";
    }
    return "var(--warning)";
  }, [roundStatus, seconds]);

  const ringStyle = {
    background: `conic-gradient(${ringColor} ${progress}%, color-mix(in oklab, var(--muted) 70%, black) ${progress}% 100%)`,
    filter: `drop-shadow(0 0 12px color-mix(in oklab, ${ringColor} 72%, transparent))`,
  };
  const isFinalCountdown = seconds <= 5 && roundStatus === "round_active";
  const isScreenSize = size === "screen";
  const timerWrapperSizeClassName = isScreenSize ? "size-[16.25rem]" : "size-[7.8rem]";
  const timerRingPaddingClassName = isScreenSize ? "p-[16px]" : "p-[10px]";
  const timerInnerInsetClassName = isScreenSize ? "inset-[22px]" : "inset-[14px]";
  const timerDigitClassName = isScreenSize
    ? "text-[6.1rem]"
    : "text-[3rem]";
  const stepTextClassName = isScreenSize
    ? "mt-2 w-[16.25rem] text-right text-2xl"
    : "mt-4 text-base";

  return (
    <div className="flex flex-col items-center justify-center">
      <div className={`relative ${timerWrapperSizeClassName}`}>
        <div
          className={`absolute inset-0 rounded-full ${timerRingPaddingClassName} shadow-[0_12px_26px_rgba(0,0,0,0.35)]`}
        >
          <div className="size-full rounded-full" style={ringStyle} />
        </div>
        <div
          className={`absolute ${timerInnerInsetClassName} flex items-center justify-center rounded-full shadow-[inset_0_3px_14px_rgba(0,0,0,0.55)] ${
            isFinalCountdown
              ? "bg-danger/35 timer-final-pulse"
              : "bg-[#21262e]"
          }`}
        >
          <p
            className={`${timerDigitClassName} font-semibold leading-none tracking-[-0.04em] tabular-nums text-foreground`}
          >
            {seconds}
          </p>
        </div>
      </div>

      <p
        className={`${stepTextClassName} font-semibold leading-none tracking-[0.02em] tabular-nums text-foreground/90`}
      >
        {String(currentStep).padStart(2, "0")}
        <span className="mx-1 text-muted-foreground">/</span>
        <span className="text-foreground/65">{String(totalSteps).padStart(2, "0")}</span>
      </p>
    </div>
  );
}
