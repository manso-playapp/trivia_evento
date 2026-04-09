import type { GameState, PowerUp, Table } from "@/types";

export const getCurrentQuestion = (state: GameState) =>
  state.currentQuestionIndex === null
    ? null
    : state.questions[state.currentQuestionIndex] ?? null;

export const getCurrentRoundNumber = (state: GameState) =>
  state.currentQuestionIndex === null ? 0 : state.currentQuestionIndex + 1;

export const getRanking = (state: GameState) =>
  [...state.tables].sort((left, right) => right.score - left.score);

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

  if (!table) {
    return false;
  }

  return table.frozenRoundNumber === getCurrentRoundNumber(state);
};
