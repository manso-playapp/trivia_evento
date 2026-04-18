import { roundStatusMeta } from "@/lib/game-status";
import type { RoundStatus } from "@/types";

const toneClassMap = {
  neutral: "broadcast-panel-soft text-foreground",
  accent: "app-accent-panel text-foreground",
  success: "border border-success/35 bg-success/14 text-success shadow-[0_10px_22px_rgba(0,0,0,0.24)]",
  warning: "border border-warning/35 bg-warning/14 text-warning shadow-[0_10px_22px_rgba(0,0,0,0.24)]",
  danger: "border border-danger/35 bg-danger/14 text-danger shadow-[0_10px_22px_rgba(0,0,0,0.24)]",
};

export function GameStatusBanner({ roundStatus }: { roundStatus: RoundStatus }) {
  const meta = roundStatusMeta[roundStatus];

  return (
    <div
      className={`rounded-[0.95rem] px-5 py-4 ${toneClassMap[meta.tone]}`}
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
