/**
 * Compat facade.
 * La logica real del dominio vive ahora en `engine/` y la ejecucion en `services/`.
 * Este archivo queda para no romper imports viejos durante la transicion.
 */
export {
  activateBomb as scheduleBomb,
  activateX2,
  applyFreezeForRound,
  applyScores as applyScore,
  lockRound,
  resetGame,
  revealCorrectAnswer as revealAnswer,
  revealQuestion as revealNextQuestion,
  simulateAnswers,
  startRound,
  submitAnswer,
} from "@/engine/game-domain";
export {
  getCurrentQuestion,
  getCurrentRoundNumber,
  getCurrentSubmittedAnswer,
  getRanking,
  isTableFrozenForCurrentRound,
} from "@/engine/game-selectors";
