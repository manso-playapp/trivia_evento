import { roundStatusMeta } from "@/lib/game-status";
import type { RoundStatus } from "@/types";

const toneClassMap = {
  neutral: "border-border bg-muted/30 text-foreground",
  accent: "border-accent/30 bg-accent/10 text-foreground",
  success: "border-success/30 bg-success/10 text-success",
  warning: "border-warning/30 bg-warning/10 text-warning",
  danger: "border-danger/30 bg-danger/10 text-danger",
};

export function GameStatusBanner({ roundStatus }: { roundStatus: RoundStatus }) {
  const meta = roundStatusMeta[roundStatus];

  return (
    <div
      className={`rounded-[1.2rem] border px-5 py-4 ${toneClassMap[meta.tone]}`}
    >
      <div className="flex items-start gap-4">
        <div className="mt-0.5 h-10 w-1 rounded-full bg-current/60" />
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] uppercase">
            {meta.label}
          </p>
          <p className="mt-1 text-sm leading-relaxed">{meta.description}</p>
        </div>
      </div>
    </div>
  );
}
