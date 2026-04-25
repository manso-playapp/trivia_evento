"use client";

import { useGame } from "@/components/game-provider";
import {
  getActiveTables,
  getCurrentQuestion,
  getCurrentRoundNumber,
  getTopScoringTables,
  getVisibleTotalRounds,
  hasUniqueWinner,
  getInactiveTables,
  getRanking,
} from "@/engine/game-selectors";
import { roundStatusMeta } from "@/lib/game-status";

/**
 * Hook de conveniencia para las vistas.
 * Evita repetir selectores basicos en cada pantalla.
 */
export const useGameView = () => {
  const { state, actions } = useGame();

  return {
    state,
    actions,
    activeTables: getActiveTables(state),
    currentQuestion: getCurrentQuestion(state),
    currentRoundNumber: getCurrentRoundNumber(state),
    finalWinners: getTopScoringTables(state),
    hasUniqueWinner: hasUniqueWinner(state),
    inactiveTables: getInactiveTables(state),
    ranking: getRanking(state),
    statusMeta: roundStatusMeta[state.roundStatus],
    visibleTotalRounds: getVisibleTotalRounds(state),
  };
};
