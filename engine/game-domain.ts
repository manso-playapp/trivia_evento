import { createInitialGameState } from "@/data/initial-game-state";
import { createDefaultPowerUps } from "@/data/mock-tables";
import {
  getActiveTables,
  getCurrentQuestion,
  getCurrentRoundNumber,
  getCurrentSubmittedAnswer,
  getPowerUp,
  isTableFrozenForCurrentRound,
} from "@/engine/game-selectors";
import type {
  AnswerOptionId,
  GameState,
  PowerUp,
  ScoreEvent,
  Table,
} from "@/types";

const POINTS_PER_CORRECT = 25;
export const MIN_POWER_UP_ROUND = 1;

const stampState = (state: GameState): GameState => ({
  ...state,
  updatedAt: new Date().toISOString(),
});

const updateTable = (
  tables: Table[],
  tableId: string,
  updater: (table: Table) => Table
) =>
  tables.map((table) => (table.id === tableId ? updater(table) : table));

const canChangeRoster = (state: GameState) => state.roundStatus === "idle";

const normalizeTableName = (name: string) =>
  name.trim().replace(/\s+/g, " ").slice(0, 40);
const clampRoundDurationSeconds = (seconds: number) =>
  Math.max(10, Math.min(120, seconds));
const clampPublicScreenPixels = (pixels: number) =>
  Math.max(320, Math.min(7680, pixels));

const resetTableSetupState = (table: Table, active: boolean): Table => ({
  ...table,
  active,
  score: 0,
  connected: active,
  powerUps: createDefaultPowerUps(),
  frozenRoundNumber: null,
  frozenByTableId: null,
});

export const setTableName = (
  state: GameState,
  tableId: string,
  name: string
): GameState => {
  if (!canChangeRoster(state)) {
    return state;
  }

  const normalizedName = normalizeTableName(name);

  if (!normalizedName) {
    return state;
  }

  const table = state.tables.find((entry) => entry.id === tableId);

  if (!table || table.name === normalizedName) {
    return state;
  }

  return stampState({
    ...state,
    tables: updateTable(state.tables, tableId, (currentTable) => ({
      ...currentTable,
      name: normalizedName,
    })),
  });
};

export const setTableActive = (
  state: GameState,
  tableId: string,
  active: boolean
): GameState => {
  if (!canChangeRoster(state)) {
    return state;
  }

  const table = state.tables.find((entry) => entry.id === tableId);

  if (!table || table.active === active) {
    return state;
  }

  return stampState({
    ...state,
    tables: updateTable(state.tables, tableId, (currentTable) =>
      resetTableSetupState(currentTable, active)
    ),
    submittedAnswers: state.submittedAnswers.filter(
      (answer) => answer.tableId !== tableId
    ),
    scoreEvents: state.scoreEvents.filter((event) => event.tableId !== tableId),
  });
};

export const setActiveTableCount = (state: GameState, count: number): GameState => {
  if (!canChangeRoster(state)) {
    return state;
  }

  const normalizedCount = Math.max(0, Math.min(state.tables.length, count));
  const tables = state.tables.map((table, index) =>
    resetTableSetupState(table, index < normalizedCount)
  );
  const activeTableIds = new Set(
    tables.filter((table) => table.active).map((table) => table.id)
  );

  return stampState({
    ...state,
    tables,
    submittedAnswers: state.submittedAnswers.filter((answer) =>
      activeTableIds.has(answer.tableId)
    ),
    scoreEvents: state.scoreEvents.filter((event) =>
      activeTableIds.has(event.tableId)
    ),
  });
};

export const setRoundDuration = (
  state: GameState,
  seconds: number
): GameState => {
  if (state.roundStatus === "round_active") {
    return state;
  }

  const nextSeconds = clampRoundDurationSeconds(seconds);

  if (nextSeconds === state.roundDurationSeconds) {
    return state;
  }

  return stampState({
    ...state,
    roundDurationSeconds: nextSeconds,
  });
};

export const setPublicScreenSize = (
  state: GameState,
  widthPx: number,
  heightPx: number
): GameState => {
  const nextWidthPx = clampPublicScreenPixels(widthPx);
  const nextHeightPx = clampPublicScreenPixels(heightPx);

  if (
    nextWidthPx === state.publicScreenWidthPx &&
    nextHeightPx === state.publicScreenHeightPx
  ) {
    return state;
  }

  return stampState({
    ...state,
    publicScreenWidthPx: nextWidthPx,
    publicScreenHeightPx: nextHeightPx,
  });
};

/**
 * Paso interno del dominio.
 * En modo realtime real, el servidor deberia aplicar este freeze antes de abrir
 * la ronda, para que todas las pantallas reciban exactamente el mismo resultado.
 */
export const applyFreezeForRound = (state: GameState): GameState => {
  const roundNumber = getCurrentRoundNumber(state);

  if (roundNumber === 0) {
    return state;
  }

  const tablesWithFreezeApplied = state.tables.map((table) => {
    if (!table.active) {
      return {
        ...table,
        frozenRoundNumber: null,
        frozenByTableId: null,
      };
    }

    const incomingBomb = state.tables.find((sourceTable) => {
      if (!sourceTable.active) {
        return false;
      }

      const bomb = getPowerUp(sourceTable, "bomb");

      return (
        bomb?.status === "armed" &&
        bomb.armedForRound === roundNumber &&
        bomb.targetTableId === table.id
      );
    });

    if (!incomingBomb) {
      return table;
    }

    return {
      ...table,
      frozenRoundNumber: roundNumber,
      frozenByTableId: incomingBomb.id,
    };
  });

  const tablesWithSpentBombs = tablesWithFreezeApplied.map((table) => ({
    ...table,
    powerUps: table.powerUps.map((powerUp): PowerUp =>
      powerUp.type === "bomb" &&
      powerUp.status === "armed" &&
      powerUp.armedForRound === roundNumber
        ? {
            ...powerUp,
            status: "spent",
            armedForRound: null,
            targetTableId: null,
            usedAtRound: roundNumber,
          }
        : powerUp
    ),
  }));

  return stampState({
    ...state,
    tables: tablesWithSpentBombs,
  });
};

export const revealQuestion = (state: GameState): GameState => {
  if (
    state.roundStatus !== "idle" &&
    state.roundStatus !== "score_updated" &&
    state.roundStatus !== "game_finished"
  ) {
    return state;
  }

  const nextIndex =
    state.currentQuestionIndex === null ? 0 : state.currentQuestionIndex + 1;

  if (nextIndex >= state.questions.length) {
    return stampState({
      ...state,
      roundStatus: "game_finished",
      roundEndsAt: null,
    });
  }

  const nextState = {
    ...state,
    currentQuestionIndex: nextIndex,
    roundStatus: "question_revealed" as const,
    roundEndsAt: null,
  };

  return startRound(nextState);
};

export const startRound = (state: GameState): GameState => {
  const question = getCurrentQuestion(state);

  if (
    !question ||
    state.roundStatus !== "question_revealed" ||
    getActiveTables(state).length === 0
  ) {
    return state;
  }

  const stateWithFreeze = applyFreezeForRound(state);

  return stampState({
    ...stateWithFreeze,
    roundStatus: "round_active",
    roundEndsAt: new Date(
      Date.now() + state.roundDurationSeconds * 1000
    ).toISOString(),
  });
};

export const submitAnswer = (
  state: GameState,
  tableId: string,
  optionId: AnswerOptionId
): GameState => {
  const question = getCurrentQuestion(state);

  if (!question || state.roundStatus !== "round_active") {
    return state;
  }

  const table = state.tables.find((entry) => entry.id === tableId);

  if (!table?.active) {
    return state;
  }

  if (isTableFrozenForCurrentRound(state, tableId)) {
    return state;
  }

  const roundNumber = getCurrentRoundNumber(state);
  const existingAnswerIndex = state.submittedAnswers.findIndex(
    (answer) =>
      answer.tableId === tableId &&
      answer.questionId === question.id &&
      answer.roundNumber === roundNumber
  );

  const nextAnswer = {
    tableId,
    questionId: question.id,
    roundNumber,
    optionId,
    updatedAt: new Date().toISOString(),
    locked: false,
  };

  const submittedAnswers =
    existingAnswerIndex === -1
      ? [...state.submittedAnswers, nextAnswer]
      : state.submittedAnswers.map((answer, index) =>
          index === existingAnswerIndex ? nextAnswer : answer
        );

  return stampState({
    ...state,
    submittedAnswers,
  });
};

export const lockRound = (state: GameState): GameState => {
  if (state.roundStatus !== "round_active") {
    return state;
  }

  const question = getCurrentQuestion(state);

  if (!question) {
    return state;
  }

  return stampState({
    ...state,
    roundStatus: "round_locked",
    roundEndsAt: null,
    submittedAnswers: state.submittedAnswers.map((answer) =>
      answer.questionId === question.id ? { ...answer, locked: true } : answer
    ),
  });
};

export const revealCorrectAnswer = (state: GameState): GameState => {
  if (state.roundStatus !== "round_locked") {
    return state;
  }

  return stampState({
    ...state,
    roundStatus: "answer_revealed",
  });
};

export const activateX2 = (state: GameState, tableId: string): GameState => {
  const targetRoundNumber = getCurrentRoundNumber(state) + 1;

  if (
    targetRoundNumber < MIN_POWER_UP_ROUND ||
    targetRoundNumber > state.totalRounds ||
    state.roundStatus !== "score_updated"
  ) {
    return state;
  }

  if (!getActiveTables(state).some((table) => table.id === tableId)) {
    return state;
  }

  return stampState({
    ...state,
    tables: updateTable(state.tables, tableId, (table) => ({
      ...table,
      powerUps: table.powerUps.map((powerUp): PowerUp =>
        powerUp.type === "x2" && powerUp.status === "available"
          ? {
              ...powerUp,
              status: "armed",
              armedForRound: targetRoundNumber,
            }
          : powerUp
      ),
    })),
  });
};

export const activateBomb = (
  state: GameState,
  sourceTableId: string,
  targetTableId: string
): GameState => {
  const targetRoundNumber = getCurrentRoundNumber(state) + 1;

  if (
    targetRoundNumber < MIN_POWER_UP_ROUND ||
    targetRoundNumber > state.totalRounds ||
    sourceTableId === targetTableId ||
    state.roundStatus !== "score_updated"
  ) {
    return state;
  }

  const activeTableIds = new Set(getActiveTables(state).map((table) => table.id));

  if (!activeTableIds.has(sourceTableId) || !activeTableIds.has(targetTableId)) {
    return state;
  }

  return stampState({
    ...state,
    tables: updateTable(state.tables, sourceTableId, (table) => ({
      ...table,
      powerUps: table.powerUps.map((powerUp): PowerUp =>
        powerUp.type === "bomb" && powerUp.status === "available"
          ? {
              ...powerUp,
              status: "armed",
              armedForRound: targetRoundNumber,
              targetTableId,
            }
          : powerUp
      ),
    })),
  });
};

export const applyScores = (state: GameState): GameState => {
  if (state.roundStatus !== "answer_revealed") {
    return state;
  }

  const question = getCurrentQuestion(state);

  if (!question) {
    return state;
  }

  const roundNumber = getCurrentRoundNumber(state);
  const scoreEvents: ScoreEvent[] = [];

  const tables = state.tables.map((table) => {
    if (!table.active) {
      return table;
    }

    const answer = getCurrentSubmittedAnswer(state, table.id);
    const x2 = getPowerUp(table, "x2");
    const hasX2 =
      x2?.status === "armed" && x2.armedForRound === roundNumber;
    const isFrozen = table.frozenRoundNumber === roundNumber;

    let reason: ScoreEvent["reason"] = "no_answer";
    let multiplier = 1;
    let basePoints = 0;
    let totalPoints = 0;

    if (isFrozen) {
      reason = "frozen";
    } else if (!answer) {
      reason = "no_answer";
    } else if (answer.optionId === question.correctOptionId) {
      reason = "correct";
      basePoints = POINTS_PER_CORRECT;
      multiplier = hasX2 ? 2 : 1;
      totalPoints = basePoints * multiplier;
    } else {
      reason = "incorrect";
    }

    scoreEvents.push({
      id: `${question.id}-${table.id}`,
      tableId: table.id,
      questionId: question.id,
      roundNumber,
      basePoints,
      multiplier,
      totalPoints,
      reason,
      createdAt: new Date().toISOString(),
    });

    return {
      ...table,
      score: table.score + totalPoints,
      frozenRoundNumber:
        table.frozenRoundNumber === roundNumber ? null : table.frozenRoundNumber,
      frozenByTableId:
        table.frozenRoundNumber === roundNumber ? null : table.frozenByTableId,
      powerUps: table.powerUps.map((powerUp): PowerUp =>
        powerUp.type === "x2" &&
        powerUp.status === "armed" &&
        powerUp.armedForRound === roundNumber
          ? {
              ...powerUp,
              status: "spent",
              armedForRound: null,
              usedAtRound: roundNumber,
            }
          : powerUp
      ),
    };
  });

  return stampState({
    ...state,
    tables,
    scoreEvents: [...state.scoreEvents, ...scoreEvents],
    roundStatus:
      roundNumber >= state.totalRounds ? "game_finished" : "score_updated",
  });
};

export const simulateAnswers = (state: GameState): GameState => {
  const question = getCurrentQuestion(state);

  if (!question || state.roundStatus !== "round_active") {
    return state;
  }

  let nextState = state;

  getActiveTables(state).forEach((table, index) => {
    if (
      isTableFrozenForCurrentRound(nextState, table.id) ||
      getCurrentSubmittedAnswer(nextState, table.id)
    ) {
      return;
    }

    const optionId = question.options[index % question.options.length].id;
    nextState = submitAnswer(nextState, table.id, optionId);
  });

  return nextState;
};

export const resetGame = (): GameState => createInitialGameState();
