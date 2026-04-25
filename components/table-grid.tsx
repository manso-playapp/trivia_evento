"use client";

import { useEffect, useState } from "react";
import {
  getActiveTables,
  getCurrentRoundNumber,
  getPowerUp,
  getRanking,
  isTableFrozenForCurrentRound,
} from "@/engine/game-selectors";
import { MIN_POWER_UP_ROUND } from "@/engine/game-domain";
import { TableCard } from "@/components/table-card";
import type { GameEvent, GameState, Table } from "@/types";

type TableGridProps = {
  state: GameState;
  showPowerUps: boolean;
  compact?: boolean;
  compactColumns?: number;
  compactRows?: number;
  includeInactive?: boolean;
  maxItems?: number;
};

const tableHasPowerUpChange = ({
  event,
  table,
  currentRoundNumber,
}: {
  event: GameEvent | null;
  table: Table;
  currentRoundNumber: number;
}) => {
  if (!event) {
    return false;
  }

  if (event.type === "x2_activated") {
    return event.payload.tableId === table.id;
  }

  if (event.type === "bomb_activated") {
    return (
      event.payload.sourceTableId === table.id ||
      event.payload.targetTableId === table.id
    );
  }

  if (event.type === "round_started") {
    return (
      table.frozenRoundNumber === currentRoundNumber ||
      table.powerUps.some(
        (powerUp) =>
          powerUp.type === "bomb" &&
          powerUp.status === "spent" &&
          powerUp.usedAtRound === currentRoundNumber
      )
    );
  }

  if (event.type === "scores_applied") {
    return table.powerUps.some(
      (powerUp) =>
        powerUp.type === "x2" &&
        powerUp.status === "spent" &&
        powerUp.usedAtRound === currentRoundNumber
    );
  }

  return false;
};

const ROUND_RESULT_CELEBRATION_MS = 6000;

export function TableGrid({
  state,
  showPowerUps,
  compact = false,
  compactColumns,
  compactRows,
  includeInactive = false,
  maxItems,
}: TableGridProps) {
  const [now, setNow] = useState(() => Date.now());
  const ranking = getRanking(state);
  const currentRoundNumber = getCurrentRoundNumber(state);
  const scoreAppliedAt =
    state.lastEvent?.type === "scores_applied"
      ? new Date(state.lastEvent.createdAt).getTime()
      : null;
  const showRoundResults =
    scoreAppliedAt !== null && now - scoreAppliedAt <= ROUND_RESULT_CELEBRATION_MS;
  const currentRoundScoreEvents = state.scoreEvents.filter(
    (scoreEvent) => scoreEvent.roundNumber === currentRoundNumber
  );
  const maxRoundPoints = Math.max(
    0,
    ...currentRoundScoreEvents.map((scoreEvent) => scoreEvent.totalPoints)
  );
  const roundResultByTableId = new Map(
    showRoundResults
      ? currentRoundScoreEvents.map((scoreEvent) => [
          scoreEvent.tableId,
          scoreEvent.reason,
        ])
      : []
  );
  const roundWinnerIds = new Set(
    showRoundResults
      ? currentRoundScoreEvents
          .filter(
            (scoreEvent) =>
              scoreEvent.totalPoints > 0 && scoreEvent.totalPoints === maxRoundPoints
          )
          .map((scoreEvent) => scoreEvent.tableId)
      : []
  );
  const powerUpsAvailable =
    currentRoundNumber >= MIN_POWER_UP_ROUND && state.roundStatus !== "idle";
  const rankingByTableId = new Map(
    ranking.map((table, index) => [table.id, index + 1])
  );
  const tables = includeInactive ? state.tables : getActiveTables(state);
  const sortedTables = [...tables].sort((left, right) =>
    left.id.localeCompare(right.id, undefined, { numeric: true })
  );
  const visibleTables =
    typeof maxItems === "number" ? sortedTables.slice(0, maxItems) : sortedTables;
  const compactGridClassName = compact
    ? "grid h-full gap-1.5"
    : "grid gap-4 sm:grid-cols-2 xl:grid-cols-4";
  const compactGridStyle =
    compact && (compactColumns || compactRows)
      ? {
          ...(compactColumns
            ? { gridTemplateColumns: `repeat(${compactColumns}, minmax(0, 1fr))` }
            : {}),
          ...(compactRows
            ? { gridTemplateRows: `repeat(${compactRows}, minmax(0, 1fr))` }
            : {}),
        }
      : undefined;

  useEffect(() => {
    if (scoreAppliedAt === null) {
      return;
    }

    const timeoutMs = Math.max(
      0,
      scoreAppliedAt + ROUND_RESULT_CELEBRATION_MS - Date.now()
    );
    const timeoutId = window.setTimeout(() => {
      setNow(Date.now());
    }, timeoutMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [scoreAppliedAt]);

  return (
    <div className={compactGridClassName} style={compactGridStyle}>
      {visibleTables.map((table) => {
        const incomingBombSource = state.tables.find((sourceTable) => {
          const bomb = getPowerUp(sourceTable, "bomb");

          return (
            sourceTable.active &&
            bomb?.status === "armed" &&
            bomb.targetTableId === table.id
          );
        });
        const incomingBomb = incomingBombSource
          ? getPowerUp(incomingBombSource, "bomb")
          : null;

        const animatePowerUps = tableHasPowerUpChange({
          event: state.lastEvent,
          table,
          currentRoundNumber,
        });
        const animateAnswerPulse =
          state.roundStatus === "round_active" &&
          state.lastEvent?.type === "answer_submitted" &&
          state.lastEvent.payload.tableId === table.id;

        return (
          <TableCard
            key={table.id}
            table={table}
            isFrozen={isTableFrozenForCurrentRound(state, table.id)}
            currentRoundNumber={currentRoundNumber}
            powerUpsAvailable={powerUpsAvailable}
            incomingBombSourceName={incomingBombSource?.name ?? null}
            incomingBombArmedForRound={incomingBomb?.armedForRound ?? null}
            animatePowerUps={animatePowerUps}
            powerUpAnimationKey={
              animatePowerUps ? state.lastEvent?.id : `${table.id}-stable`
            }
            rankingPosition={rankingByTableId.get(table.id)}
            showPowerUps={showPowerUps}
            compact={compact}
            roundResult={roundResultByTableId.get(table.id) ?? null}
            isRoundWinner={roundWinnerIds.has(table.id)}
            animateAnswerPulse={animateAnswerPulse}
          />
        );
      })}
    </div>
  );
}
