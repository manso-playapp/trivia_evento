import { PartyPopper, Snowflake, ThumbsDown, ThumbsUp, Trophy, Wifi } from "lucide-react";

import { PowerUpBadge, type PowerUpDisplayMode } from "@/components/power-up-badge";
import { SuccessConfetti } from "@/components/success-confetti";
import type { ScoreReason, Table } from "@/types";

type TableCardProps = {
  table: Table;
  isFrozen: boolean;
  currentRoundNumber: number;
  powerUpsAvailable: boolean;
  incomingBombSourceName?: string | null;
  incomingBombArmedForRound?: number | null;
  animatePowerUps?: boolean;
  powerUpAnimationKey?: string;
  rankingPosition?: number;
  showPowerUps: boolean;
  compact?: boolean;
  roundResult?: ScoreReason | null;
  isRoundWinner?: boolean;
  animateAnswerPulse?: boolean;
};

const getIncomingBombMode = ({
  isFrozen,
  incomingBombSourceName,
}: {
  isFrozen: boolean;
  incomingBombSourceName?: string | null;
}): PowerUpDisplayMode => {
  if (isFrozen) {
    return "using";
  }

  if (incomingBombSourceName) {
    return "using";
  }

  return "inactive";
};

export function TableCard({
  table,
  isFrozen,
  currentRoundNumber,
  powerUpsAvailable,
  incomingBombSourceName,
  incomingBombArmedForRound,
  animatePowerUps = false,
  powerUpAnimationKey,
  rankingPosition,
  showPowerUps,
  compact = false,
  roundResult = null,
  isRoundWinner = false,
  animateAnswerPulse = false,
}: TableCardProps) {
  const x2PowerUp = table.powerUps.find((powerUp) => powerUp.type === "x2");
  const bombPowerUp = table.powerUps.find((powerUp) => powerUp.type === "bomb");
  const shouldShowX2 = Boolean(x2PowerUp && x2PowerUp.status !== "spent");
  const shouldShowOwnBomb = Boolean(
    bombPowerUp && bombPowerUp.status !== "spent"
  );
  const shouldShowIncomingBomb = isFrozen || Boolean(incomingBombSourceName);
  const isBombedForRound = shouldShowIncomingBomb;
  const incomingBombMode = getIncomingBombMode({
    isFrozen,
    incomingBombSourceName,
  });
  const incomingBombDetail = isFrozen
    ? table.frozenByTableId?.replace("table-", "M")
    : incomingBombSourceName
      ? `${incomingBombSourceName.replace("Mesa ", "M")} > ${
          incomingBombArmedForRound === currentRoundNumber
            ? "ahora"
            : `R${incomingBombArmedForRound ?? "-"}`
        }`
      : null;
  const powerUpRowClassName = animatePowerUps ? "power-up-change-pulse" : "";
  const showPositiveResult = roundResult === "correct";
  const showNegativeResult =
    roundResult === "incorrect" || roundResult === "no_answer" || roundResult === "frozen";
  const answerPulseClassName = animateAnswerPulse ? "table-answer-pulse" : "";

  if (compact) {
    const tableNumber = table.id.replace("table-", "");
    const compactToneClassName = !table.active
      ? "border-border/30 bg-background/40 opacity-60"
      : isRoundWinner
        ? "border-success/70 bg-success/18 shadow-[0_0_0_1px_color-mix(in_oklab,var(--success)_22%,transparent),0_0_24px_color-mix(in_oklab,var(--success)_18%,transparent)]"
        : showPositiveResult
          ? "border-success/60 bg-success/12"
          : showNegativeResult
            ? "border-danger/55 bg-danger/12"
            : isBombedForRound
              ? "border-border/25 bg-background/25"
              : "border-border/65 bg-surface/90";
    const compactTextToneClassName = isBombedForRound
      ? "text-muted-foreground/30"
      : "text-foreground";
    const compactStatusClassName = showPositiveResult
      ? "text-success"
      : showNegativeResult
        ? "text-danger"
        : "text-muted-foreground";

    return (
      <div
        className={`relative h-full overflow-hidden rounded-[0.5rem] border px-2.5 py-1.5 ${compactToneClassName} ${answerPulseClassName}`}
      >
        {showPositiveResult ? <SuccessConfetti /> : null}
        <div className="flex h-full flex-col justify-between gap-1">
          <div className="flex min-w-0 items-baseline justify-between gap-2">
            <p className={`min-w-0 truncate text-[11px] font-semibold uppercase tracking-[0.14em] ${compactTextToneClassName}`}>
              Mesa {tableNumber}
            </p>
            <span className={`shrink-0 text-lg font-semibold leading-none tabular-nums ${compactTextToneClassName}`}>
              {table.score}
            </span>
          </div>
          <div className="flex min-h-[1rem] items-center gap-1">
            {isRoundWinner ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-success">
                <Trophy className="size-3" />
                Gano ronda
              </span>
            ) : showPositiveResult ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-success">
                <ThumbsUp className="size-3" />
                Correcta
              </span>
            ) : showNegativeResult ? (
              <span className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${compactStatusClassName}`}>
                <ThumbsDown className="size-3" />
                {roundResult === "frozen" ? "Congelada" : "No sumo"}
              </span>
            ) : null}
          </div>
          {showPowerUps ? (
            <div
              key={powerUpAnimationKey}
              className={`flex h-6 min-w-0 items-center justify-between gap-2 ${powerUpRowClassName}`}
            >
              <div className="flex min-w-0 items-center gap-1">
                {shouldShowX2 && x2PowerUp ? (
                  <PowerUpBadge
                    powerUp={x2PowerUp}
                    compact
                    availableForCurrentRound={powerUpsAvailable}
                  />
                ) : null}
                {shouldShowOwnBomb && bombPowerUp ? (
                  <PowerUpBadge
                    powerUp={bombPowerUp}
                    compact
                    availableForCurrentRound={powerUpsAvailable}
                  />
                ) : null}
              </div>
              {shouldShowIncomingBomb ? (
                <PowerUpBadge
                  type="bomb"
                  label="Bomba recibida"
                  detail={incomingBombDetail}
                  mode={incomingBombMode}
                  compact
                />
              ) : null}
            </div>
          ) : null}
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
  const surfaceClassName = isRoundWinner
    ? "border-success/70 bg-success/12 shadow-[0_0_0_1px_color-mix(in_oklab,var(--success)_24%,transparent),0_10px_28px_rgba(0,0,0,0.24)]"
    : showPositiveResult
      ? "border-success/55 bg-success/10 shadow-[0_10px_22px_rgba(0,0,0,0.24)]"
      : showNegativeResult
        ? "border-danger/48 bg-danger/10 shadow-[0_10px_22px_rgba(0,0,0,0.24)]"
        : "bg-surface/95 shadow-[0_1px_0_rgba(255,255,255,0.03)_inset]";
  const statusPillClassName = isRoundWinner
    ? "border-success/60 bg-success/14 text-success"
    : showPositiveResult
      ? "border-success/55 bg-success/12 text-success"
      : showNegativeResult
        ? "border-danger/55 bg-danger/12 text-danger"
        : "border-border/70 bg-background/80 text-muted-foreground";
  const statusLabel = isRoundWinner
    ? "Gano la ronda"
    : showPositiveResult
      ? "Correcta"
      : showNegativeResult
        ? roundResult === "frozen"
          ? "Congelada"
          : roundResult === "no_answer"
            ? "Sin respuesta"
            : "Incorrecta"
        : "En juego";

  return (
    <div className={`relative overflow-hidden rounded-[0.5rem] border p-4 ${rankClassName} ${surfaceClassName} ${answerPulseClassName}`}>
      {showPositiveResult ? <SuccessConfetti /> : null}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {rankingPosition ? (
              <span className="rounded-full border border-border/70 bg-background/80 px-2.5 py-1 text-[10px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                #{rankingPosition}
              </span>
            ) : null}
            <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-[0.18em] uppercase ${statusPillClassName}`}>
              {statusLabel}
            </span>
            {isRoundWinner ? (
              <span className="rounded-full border border-success/55 bg-success/12 px-2.5 py-1 text-[10px] font-semibold tracking-[0.18em] text-success uppercase">
                <span className="inline-flex items-center gap-1">
                  <PartyPopper className="size-3" />
                  Mejor ronda
                </span>
              </span>
            ) : null}
          </div>
          <p className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
            {table.name}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {isRoundWinner
              ? "Fue una de las mesas ganadoras de la ronda."
              : rankingPosition
                ? "Posicion actual del scoreboard"
                : "Equipo en juego"}
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
          <div className="rounded-full border border-danger/45 bg-danger/16 px-2.5 py-1.5 text-[10px] font-semibold tracking-[0.18em] text-danger uppercase">
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
        <div
          key={powerUpAnimationKey}
          className={`mt-4 flex flex-wrap gap-2 border-t border-border/50 pt-4 ${powerUpRowClassName}`}
        >
          {shouldShowX2 && x2PowerUp ? (
            <PowerUpBadge
              powerUp={x2PowerUp}
              availableForCurrentRound={powerUpsAvailable}
            />
          ) : null}
          {shouldShowOwnBomb && bombPowerUp ? (
            <PowerUpBadge
              powerUp={bombPowerUp}
              availableForCurrentRound={powerUpsAvailable}
            />
          ) : null}
          {shouldShowIncomingBomb ? (
            <PowerUpBadge
              type="bomb"
              label="Bomba recibida"
              detail={incomingBombDetail}
              mode={incomingBombMode}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
