"use client";

import { useGame } from "@/components/game-provider";
import {
  getCurrentQuestion,
  getCurrentRoundNumber,
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
    currentQuestion: getCurrentQuestion(state),
    currentRoundNumber: getCurrentRoundNumber(state),
    ranking: getRanking(state),
    statusMeta: roundStatusMeta[state.roundStatus],
  };
};
