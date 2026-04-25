import type { GameState, PowerUp, Table } from "@/types";

export const MAIN_ROUND_COUNT = 20;

export const getActiveTables = (state: GameState) =>
  state.tables.filter((table) => table.active);

export const getInactiveTables = (state: GameState) =>
  state.tables.filter((table) => !table.active);

export const isTableActive = (state: GameState, tableId: string) =>
  state.tables.some((table) => table.id === tableId && table.active);

export const getCurrentQuestion = (state: GameState) =>
  state.currentQuestionIndex === null
    ? null
    : state.questions[state.currentQuestionIndex] ?? null;

export const getCurrentRoundNumber = (state: GameState) =>
  state.currentQuestionIndex === null ? 0 : state.currentQuestionIndex + 1;

export const isTiebreakerRound = (state: GameState) =>
  getCurrentRoundNumber(state) > MAIN_ROUND_COUNT;

export const getRanking = (state: GameState) =>
  [...getActiveTables(state)].sort((left, right) => right.score - left.score);

export const getTopScoringTables = (state: GameState) => {
  const ranking = getRanking(state);
  const topScore = ranking[0]?.score;

  if (topScore === undefined) {
    return [];
  }

  return ranking.filter((table) => table.score === topScore);
};

export const hasUniqueWinner = (state: GameState) =>
  getTopScoringTables(state).length === 1;

export const needsTiebreaker = (state: GameState) =>
  getTopScoringTables(state).length > 1;

export const isTableEligibleForCurrentRound = (
  state: GameState,
  tableId: string
) => {
  if (!isTiebreakerRound(state)) {
    return true;
  }

  return (state.tiebreakerTableIds ?? []).includes(tableId);
};

export const getVisibleTotalRounds = (state: GameState) => {
  const currentRoundNumber = getCurrentRoundNumber(state);

  return currentRoundNumber > MAIN_ROUND_COUNT
    ? state.questions.length
    : Math.min(MAIN_ROUND_COUNT, state.questions.length || state.totalRounds);
};

export const getPowerUp = (table: Table, type: PowerUp["type"]) =>
  table.powerUps.find((powerUp) => powerUp.type === type);

export const getCurrentSubmittedAnswer = (
  state: GameState,
  tableId: string
) => {
  const currentQuestion = getCurrentQuestion(state);

  if (!currentQuestion) {
    return null;
  }

  return (
    state.submittedAnswers.find(
      (answer) =>
        answer.tableId === tableId && answer.questionId === currentQuestion.id
    ) ?? null
  );
};

export const isTableFrozenForCurrentRound = (
  state: GameState,
  tableId: string
) => {
  const table = state.tables.find((entry) => entry.id === tableId);

  if (!table || !table.active) {
    return false;
  }

  return table.frozenRoundNumber === getCurrentRoundNumber(state);
};
