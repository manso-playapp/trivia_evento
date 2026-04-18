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
    const tableNumber = table.id.replace("table-", "");
    const compactToneClassName = !table.active
      ? "border-border/30 bg-background/40 opacity-60"
      : isFrozen
        ? "border-warning/45 bg-warning/20 text-warning"
        : hasAnswered
          ? "border-success/65 bg-success/16"
          : "border-border/65 bg-surface/90";

    return (
      <div
        className={`h-full rounded-[0.5rem] border px-2.5 py-1.5 ${compactToneClassName}`}
      >
        <div className="flex h-full items-center justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground">
            Mesa {tableNumber}
          </p>
          <span className="text-lg font-semibold leading-none tabular-nums text-foreground">
            {table.score}
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
    <div className={`rounded-[0.5rem] border bg-surface/95 p-4 shadow-[0_1px_0_rgba(255,255,255,0.03)_inset] ${rankClassName}`}>
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
