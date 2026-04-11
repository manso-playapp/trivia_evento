import { Snowflake, Wifi } from "lucide-react";

import { PowerUpBadge } from "@/components/power-up-badge";
import type { Table } from "@/types";

type TableCardProps = {
  table: Table;
  hasAnswered: boolean;
  isFrozen: boolean;
  rankingPosition?: number;
  showPowerUps: boolean;
  compact?: boolean;
};

export function TableCard({
  table,
  hasAnswered,
  isFrozen,
  rankingPosition,
  showPowerUps,
  compact = false,
}: TableCardProps) {
  if (compact) {
    return (
      <div
        className={`rounded-xl border p-2 ${
          table.active
            ? "border-border/70 bg-surface/95"
            : "border-border/40 bg-background/35 opacity-70"
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-xs font-semibold text-foreground">{table.name}</p>
          <p className="text-base font-semibold leading-none text-foreground">{table.score}</p>
        </div>
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <span className="truncate text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            {table.id}
          </span>
          <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            {table.active ? (hasAnswered ? "Respondio" : "Pendiente") : "Inactiva"}
          </span>
        </div>
      </div>
    );
  }

  const rankClassName =
    rankingPosition === 1
      ? "border-accent/35"
      : rankingPosition && rankingPosition <= 3
        ? "border-white/14"
        : "border-border/70";

  return (
    <div className={`rounded-[1.25rem] border bg-surface/95 p-4 shadow-[0_1px_0_rgba(255,255,255,0.03)_inset] ${rankClassName}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {rankingPosition ? (
              <span className="rounded-full border border-border/70 bg-background/80 px-2.5 py-1 text-[10px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                #{rankingPosition}
              </span>
            ) : null}
            <span className="rounded-full border border-border/70 bg-background/80 px-2.5 py-1 text-[10px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
              {hasAnswered ? "Respondio" : "Pendiente"}
            </span>
          </div>
          <p className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
            {table.name}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {rankingPosition ? "Posicion actual del scoreboard" : "Equipo en juego"}
          </p>
        </div>

        <div className="broadcast-panel-soft min-w-20 px-3 py-2 text-right">
          <p className="text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
            Score
          </p>
          <p className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
            {table.score}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {isFrozen ? (
          <div className="rounded-full border border-warning/30 bg-warning/12 px-2.5 py-1.5 text-[10px] font-semibold tracking-[0.18em] text-warning uppercase">
            <span className="inline-flex items-center gap-1">
              <Snowflake className="size-3" />
              Congelada
            </span>
          </div>
        ) : null}
        <div className="rounded-full border border-border/70 bg-background/80 px-2.5 py-1.5 text-[10px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
          <span className="inline-flex items-center gap-1">
            <Wifi className="size-3" />
            {table.connected ? "Online" : "Offline"}
          </span>
        </div>
      </div>

      {showPowerUps ? (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-border/50 pt-4">
          {table.powerUps.map((powerUp) => (
            <PowerUpBadge key={`${table.id}-${powerUp.type}`} powerUp={powerUp} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
