"use client";

import { useEffect, useRef, useState } from "react";

type TypewriterTextProps = {
  text: string;
  speedMs?: number;
  startDelayMs?: number;
  className?: string;
  cursorClassName?: string;
  showCursorWhenDone?: boolean;
  onComplete?: () => void;
};

const getStepDelay = (value: string, index: number, baseDelay: number) => {
  const character = value[index - 1];

  if (!character) {
    return baseDelay;
  }

  if ([".", ",", ":", ";", "!", "?"].includes(character)) {
    return baseDelay * 4;
  }

  if (character === " ") {
    return Math.max(12, Math.floor(baseDelay * 0.65));
  }

  return baseDelay;
};

export function TypewriterText({
  text,
  speedMs = 26,
  startDelayMs = 0,
  className,
  cursorClassName,
  showCursorWhenDone = false,
  onComplete,
}: TypewriterTextProps) {
  const [visibleCount, setVisibleCount] = useState(text.length);
  const [reduceMotion, setReduceMotion] = useState<boolean | null>(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReduceMotion(mediaQuery.matches);

    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);

    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    let timeoutId: number | null = null;

    if (reduceMotion === null) {
      return;
    }

    if (!text) {
      timeoutId = window.setTimeout(() => setVisibleCount(0), 0);
      return () => {
        if (timeoutId !== null) {
          window.clearTimeout(timeoutId);
        }
      };
    }

    if (reduceMotion) {
      timeoutId = window.setTimeout(() => {
        setVisibleCount(text.length);
        onCompleteRef.current?.();
      }, 0);
      return () => {
        if (timeoutId !== null) {
          window.clearTimeout(timeoutId);
        }
      };
    }

    let cancelled = false;

    const tick = (currentCount: number) => {
      if (cancelled) {
        return;
      }

      const nextCount = currentCount + 1;
      setVisibleCount(nextCount);

      if (nextCount >= text.length) {
        onCompleteRef.current?.();
        return;
      }

      timeoutId = window.setTimeout(
        () => tick(nextCount),
        getStepDelay(text, nextCount, speedMs)
      );
    };

    timeoutId = window.setTimeout(() => {
      setVisibleCount(0);
      timeoutId = window.setTimeout(() => tick(0), startDelayMs);
    }, 0);

    return () => {
      cancelled = true;

      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [reduceMotion, speedMs, startDelayMs, text]);

  const visibleText = reduceMotion !== false ? text : text.slice(0, visibleCount);
  const isComplete = visibleCount >= text.length;
  const showCursor = reduceMotion === false && (!isComplete || showCursorWhenDone);

  return (
    <span
      className={className}
      aria-label={text}
    >
      <span aria-hidden="true">{visibleText}</span>
      {showCursor ? (
        <span
          aria-hidden="true"
          className={cursorClassName ?? "typewriter-cursor"}
        >
          |
        </span>
      ) : null}
    </span>
  );
}
