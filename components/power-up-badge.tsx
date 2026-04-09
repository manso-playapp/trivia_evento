import { Bomb, CircleGauge } from "lucide-react";

import type { PowerUp } from "@/types";

type PowerUpBadgeProps = {
  powerUp: PowerUp;
};

const powerUpToneClassMap = {
  available: "border-border/70 bg-background/80 text-foreground",
  armed: "border-accent/30 bg-accent/12 text-accent",
  spent: "border-border/60 bg-muted/30 text-muted-foreground/70",
};

export function PowerUpBadge({ powerUp }: PowerUpBadgeProps) {
  const Icon = powerUp.type === "bomb" ? Bomb : CircleGauge;
  const targetLabel = powerUp.targetTableId
    ? powerUp.targetTableId.replace("table-", "M")
    : null;

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-semibold tracking-[0.16em] uppercase ${powerUpToneClassMap[powerUp.status]}`}
      title={powerUp.description}
    >
      <Icon className="size-3.5" />
      <span>{powerUp.label}</span>
      {powerUp.status === "armed" && targetLabel ? (
        <span className="text-current/80">/{targetLabel}</span>
      ) : null}
    </div>
  );
}
