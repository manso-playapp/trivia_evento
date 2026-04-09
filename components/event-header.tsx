import { Trophy } from "lucide-react";

import { StatusBadge } from "@/components/status-badge";

type EventHeaderProps = {
  eventName: string;
  eventTagline: string;
  currentRoundNumber: number;
  totalRounds: number;
  statusLabel: string;
  statusTone: "neutral" | "accent" | "success" | "warning" | "danger";
};

export function EventHeader({
  eventName,
  eventTagline,
  currentRoundNumber,
  totalRounds,
  statusLabel,
  statusTone,
}: EventHeaderProps) {
  return (
    <div className="broadcast-panel relative overflow-hidden px-5 py-5 sm:px-7 sm:py-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/8" />
      <div className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr] xl:items-end">
        <div className="space-y-4">
          <p className="broadcast-label text-accent">
          {eventTagline}
          </p>
          <div>
            <h1 className="max-w-4xl text-3xl font-semibold leading-none tracking-[-0.04em] text-foreground sm:text-5xl xl:text-6xl">
              {eventName}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              MVP local con flujo simulado entre operador, pantalla publica y mesas.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:justify-self-end">
          <div className="broadcast-panel-soft min-w-40 px-4 py-4">
            <p className="broadcast-label">Ronda</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {currentRoundNumber}
              <span className="ml-1 text-lg text-muted-foreground sm:text-xl">
                / {totalRounds}
              </span>
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Secuencia principal del juego
            </p>
          </div>
          <div className="broadcast-panel-soft min-w-40 px-4 py-4">
            <p className="mb-3 flex items-center gap-2 broadcast-label">
              <Trophy className="size-3.5 text-accent" />
              Estado
            </p>
            <StatusBadge label={statusLabel} tone={statusTone} />
            <p className="mt-3 text-xs text-muted-foreground">
              Referencia comun para operador, screen y mobile
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
