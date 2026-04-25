import { Bomb } from "lucide-react";

import type { PowerUp, PowerUpType } from "@/types";

type PowerUpBadgeProps = {
  powerUp?: PowerUp;
  type?: PowerUpType;
  mode?: PowerUpDisplayMode;
  label?: string;
  detail?: string | null;
  compact?: boolean;
  availableForCurrentRound?: boolean;
};

export type PowerUpDisplayMode = "inactive" | "ready" | "using" | "used";

const powerUpToneClassMap: Record<PowerUpDisplayMode, string> = {
  inactive: "border-border/45 bg-muted/20 text-muted-foreground/45",
  ready: "border-cyan-300/35 bg-cyan-300/12 text-cyan-100",
  using: "border-danger/60 bg-danger/18 text-danger shadow-[0_0_18px_rgba(239,68,68,0.22)]",
  used: "border-border/45 bg-muted/25 text-muted-foreground/60",
};

const getModeFromPowerUp = (
  powerUp: PowerUp,
  availableForCurrentRound: boolean
): PowerUpDisplayMode => {
  if (powerUp.status === "spent") {
    return "used";
  }

  if (powerUp.status === "armed") {
    return "ready";
  }

  return availableForCurrentRound ? "inactive" : "inactive";
};

export function PowerUpBadge({
  powerUp,
  type,
  mode,
  label,
  detail,
  compact = false,
  availableForCurrentRound = true,
}: PowerUpBadgeProps) {
  const powerUpType = powerUp?.type ?? type ?? "x2";
  const displayMode =
    mode ??
    (powerUp ? getModeFromPowerUp(powerUp, availableForCurrentRound) : "inactive");
  const targetLabel = detail ?? (powerUp?.targetTableId
    ? powerUp.targetTableId.replace("table-", "M")
    : null);
  const displayLabel = label ?? powerUp?.label ?? (powerUpType === "bomb" ? "BOMBA" : "X2");
  const title = powerUp?.description ?? displayLabel;

  if (compact) {
    return (
      <div
        className={`inline-flex size-6 shrink-0 items-center justify-center rounded-[0.45rem] border ${powerUpToneClassMap[displayMode]}`}
        title={targetLabel ? `${displayLabel} / ${targetLabel}` : title}
        aria-label={targetLabel ? `${displayLabel} ${targetLabel}` : displayLabel}
      >
        {powerUpType === "bomb" ? (
          <Bomb className="size-3.5" />
        ) : (
          <span className="text-[0.62rem] font-black leading-none tracking-[-0.04em]">
            X2
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className={`inline-flex min-h-8 items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-semibold tracking-[0.16em] uppercase ${powerUpToneClassMap[displayMode]}`}
      title={targetLabel ? `${displayLabel} / ${targetLabel}` : title}
    >
      {powerUpType === "bomb" ? (
        <Bomb className="size-3.5" />
      ) : (
        <span className="text-[0.68rem] font-black leading-none tracking-[-0.04em]">
          X2
        </span>
      )}
      <span>{displayLabel}</span>
      {targetLabel ? (
        <span className="text-current/80">/{targetLabel}</span>
      ) : null}
    </div>
  );
}
