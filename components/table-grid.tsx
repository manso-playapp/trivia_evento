import {
  getActiveTables,
  getCurrentSubmittedAnswer,
  getRanking,
  isTableFrozenForCurrentRound,
} from "@/engine/game-selectors";
import { TableCard } from "@/components/table-card";
import type { GameState } from "@/types";

type TableGridProps = {
  state: GameState;
  showPowerUps: boolean;
  compact?: boolean;
  includeInactive?: boolean;
  maxItems?: number;
};

export function TableGrid({
  state,
  showPowerUps,
  compact = false,
  includeInactive = false,
  maxItems,
}: TableGridProps) {
  const ranking = getRanking(state);
  const rankingByTableId = new Map(
    ranking.map((table, index) => [table.id, index + 1])
  );
  const tables = includeInactive ? state.tables : getActiveTables(state);
  const sortedTables = [...tables].sort((left, right) =>
    left.id.localeCompare(right.id, undefined, { numeric: true })
  );
  const visibleTables =
    typeof maxItems === "number" ? sortedTables.slice(0, maxItems) : sortedTables;

  return (
    <div className={compact ? "grid grid-cols-5 gap-2" : "grid gap-4 sm:grid-cols-2 xl:grid-cols-4"}>
      {visibleTables.map((table) => (
        <TableCard
          key={table.id}
          table={table}
          hasAnswered={Boolean(getCurrentSubmittedAnswer(state, table.id))}
          isFrozen={isTableFrozenForCurrentRound(state, table.id)}
          rankingPosition={rankingByTableId.get(table.id)}
          showPowerUps={showPowerUps}
          compact={compact}
        />
      ))}
    </div>
  );
}
