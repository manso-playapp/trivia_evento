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
};

export function TableGrid({ state, showPowerUps }: TableGridProps) {
  const ranking = getRanking(state);
  const rankingByTableId = new Map(
    ranking.map((table, index) => [table.id, index + 1])
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[...getActiveTables(state)]
        .sort((left, right) =>
          left.id.localeCompare(right.id, undefined, { numeric: true })
        )
        .map((table) => (
          <TableCard
            key={table.id}
            table={table}
            hasAnswered={Boolean(getCurrentSubmittedAnswer(state, table.id))}
            isFrozen={isTableFrozenForCurrentRound(state, table.id)}
            rankingPosition={rankingByTableId.get(table.id)}
            showPowerUps={showPowerUps}
          />
        ))}
    </div>
  );
}
