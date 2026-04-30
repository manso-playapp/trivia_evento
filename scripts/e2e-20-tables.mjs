#!/usr/bin/env node

const DEFAULT_BASE_URL = process.env.TRIVIA_BASE_URL ?? "http://127.0.0.1:3000";
const DEFAULT_TABLE_COUNT = Number(process.env.TRIVIA_TABLE_COUNT ?? "20");
const DEFAULT_ROUND_DURATION_SECONDS = Number(
  process.env.TRIVIA_ROUND_DURATION_SECONDS ?? "20"
);
const DEFAULT_ANSWER_DELAY_MS = Number(process.env.TRIVIA_ANSWER_DELAY_MS ?? "80");
const DEFAULT_BETWEEN_ROUNDS_MS = Number(process.env.TRIVIA_BETWEEN_ROUNDS_MS ?? "5000");
const DEFAULT_ENABLE_POWER_UPS = process.env.TRIVIA_ENABLE_POWER_UPS === "true";

const args = new Map();

for (const arg of process.argv.slice(2)) {
  if (!arg.startsWith("--")) {
    continue;
  }

  const [key, value = "true"] = arg.slice(2).split("=");
  args.set(key, value);
}

const baseUrl = args.get("base-url") ?? DEFAULT_BASE_URL;
const tableCount = Number(args.get("table-count") ?? DEFAULT_TABLE_COUNT);
const roundDurationSeconds = Number(
  args.get("round-duration-seconds") ?? DEFAULT_ROUND_DURATION_SECONDS
);
const answerDelayMs = Number(args.get("answer-delay-ms") ?? DEFAULT_ANSWER_DELAY_MS);
const betweenRoundsMs = Number(
  args.get("between-rounds-ms") ?? DEFAULT_BETWEEN_ROUNDS_MS
);
const randomCorrect = args.get("random-correct") === "true";
const randomPowerUps = args.get("random-power-ups") === "true";
const enablePowerUps = args.get("enable-power-ups") === "true" || DEFAULT_ENABLE_POWER_UPS;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const sample = (items) => items[Math.floor(Math.random() * items.length)];

class SessionClient {
  constructor(name) {
    this.name = name;
    this.cookies = new Map();
  }

  cookieHeader() {
    return Array.from(this.cookies.entries())
      .map(([key, value]) => `${key}=${value}`)
      .join("; ");
  }

  storeCookies(response) {
    const setCookie = response.headers.get("set-cookie");

    if (!setCookie) {
      return;
    }

    const cookiePairs = setCookie.split(/,(?=\s*[^;=]+=[^;]+)/);

    for (const cookiePair of cookiePairs) {
      const [cookie] = cookiePair.split(";");
      const separatorIndex = cookie.indexOf("=");

      if (separatorIndex === -1) {
        continue;
      }

      const key = cookie.slice(0, separatorIndex).trim();
      const value = cookie.slice(separatorIndex + 1).trim();
      this.cookies.set(key, value);
    }
  }

  async request(path, init = {}) {
    const headers = new Headers(init.headers ?? {});
    const cookieHeader = this.cookieHeader();

    if (cookieHeader) {
      headers.set("cookie", cookieHeader);
    }

    const response = await fetch(new URL(path, baseUrl), {
      ...init,
      headers,
    });

    this.storeCookies(response);
    return response;
  }
}

const operator = new SessionClient("operator");
const tables = Array.from({ length: tableCount }, (_, index) => ({
  id: `table-${index + 1}`,
  code: String(1000 + index + 1),
  client: new SessionClient(`table-${index + 1}`),
}));

const parseJson = async (response) => {
  try {
    return await response.json();
  } catch {
    return {};
  }
};

const ensureOk = async (response, context) => {
  if (response.ok) {
    return parseJson(response);
  }

  const body = await parseJson(response);
  const message = body?.error ?? `${context} failed with ${response.status}`;
  throw new Error(`${context}: ${message}`);
};

const command = async (client, gameCommand, actorId = "operator") => {
  const maxAttempts = 30;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const stateResponse = await client.request("/api/game/state");
    const stateBody = await ensureOk(stateResponse, "read state");
    const expectedRevision = stateBody.state?.revision ?? 0;

    const response = await client.request("/api/game/command", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        command: gameCommand,
        actorId,
        expectedRevision,
      }),
    });

    if (response.status !== 409) {
      const body = await ensureOk(response, `command ${gameCommand.type}`);
      return body.state;
    }

    if (attempt < maxAttempts) {
      await sleep(120 * attempt);
      continue;
    }

    await ensureOk(response, `command ${gameCommand.type}`);
  }
};

const getState = async (client = operator) => {
  const response = await client.request("/api/game/state");
  const body = await ensureOk(response, "read state");
  return body.state;
};

const wrongOptionForQuestion = (question) =>
  sample(question.options.filter((option) => option.id !== question.correctOptionId))?.id ??
  question.correctOptionId;

const selectCorrectTableIds = (activeTables) => {
  if (!randomCorrect) {
    return new Set(
      activeTables
        .slice(0, Math.ceil(activeTables.length * 0.3))
        .map((table) => table.id)
    );
  }

  const shuffledTables = [...activeTables].sort(() => Math.random() - 0.5);
  const correctCount = Math.max(
    1,
    Math.min(
      activeTables.length,
      Math.round(activeTables.length * (0.25 + Math.random() * 0.45))
    )
  );

  return new Set(shuffledTables.slice(0, correctCount).map((table) => table.id));
};

const answerOptionForTable = (question, table, correctTableIds) => {
  if (correctTableIds.has(table.id)) {
    return question.correctOptionId;
  }

  return wrongOptionForQuestion(question);
};

const hasAvailablePowerUp = (table, type) =>
  table.powerUps.some((powerUp) => powerUp.type === type && powerUp.status === "available");

const maybeActivateRandomPowerUps = async (state, round) => {
  if (!randomPowerUps || !enablePowerUps || round >= state.totalRounds) {
    return { state, x2TableName: null, bombLabel: null };
  }

  let nextState = state;
  let x2TableName = null;
  let bombLabel = null;
  const activeTables = nextState.tables.filter((table) => table.active);

  // X2: la propia mesa activa su comodin
  const x2Candidates = activeTables.filter((table) => hasAvailablePowerUp(table, "x2"));
  if (x2Candidates.length > 0 && Math.random() < 0.55) {
    const x2Table = sample(x2Candidates);
    const tableClient = tables.find((t) => t.id === x2Table.id)?.client ?? operator;
    nextState = await command(
      tableClient,
      { type: "activate_x2", tableId: x2Table.id },
      x2Table.id
    );
    x2TableName = x2Table.name;
  }

  // Bomba: la mesa origen elige y lanza contra otra mesa
  const bombSourceCandidates = nextState.tables
    .filter((table) => table.active && hasAvailablePowerUp(table, "bomb"));
  if (bombSourceCandidates.length > 0 && Math.random() < 0.45) {
    const sourceTable = sample(bombSourceCandidates);
    const targetCandidates = nextState.tables.filter(
      (table) => table.active && table.id !== sourceTable.id
    );
    if (targetCandidates.length > 0) {
      const targetTable = sample(targetCandidates);
      const sourceClient = tables.find((t) => t.id === sourceTable.id)?.client ?? operator;
      nextState = await command(
        sourceClient,
        { type: "activate_bomb", sourceTableId: sourceTable.id, targetTableId: targetTable.id },
        sourceTable.id
      );
      bombLabel = `${sourceTable.name} -> ${targetTable.name}`;
    }
  }

  return { state: nextState, x2TableName, bombLabel };
};

const authenticateTables = async () => {
  for (const table of tables) {
    const response = await table.client.request("/api/table/session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tableId: table.id,
        accessCode: table.code,
      }),
    });

    await ensureOk(response, `auth ${table.id}`);
  }
};

const main = async () => {
  const startedAt = Date.now();
  const roundMetrics = [];

  console.log(`Base URL: ${baseUrl}`);
  console.log(`Mesas: ${tableCount}`);
  console.log(`Timer por ronda: ${roundDurationSeconds}s`);
  console.log(`Espera entre rondas: ${(betweenRoundsMs / 1000).toFixed(1)}s`);
  console.log(`Correctas aleatorias: ${randomCorrect ? "si" : "no"}`);
  console.log(`Comodines: ${enablePowerUps ? (randomPowerUps ? "activados + aleatorios" : "activados") : "desactivados"}`);

  await authenticateTables();
  console.log("Mesas autenticadas.");

  await command(operator, { type: "reset_game" });
  await command(operator, { type: "set_round_duration", seconds: roundDurationSeconds });

  if (enablePowerUps) {
    await command(operator, { type: "enable_power_ups" });
    console.log("Comodines activados.");
  }

  let state = await getState();
  const totalRounds = state.totalRounds;

  for (let round = 1; round <= totalRounds; round += 1) {
    const roundStartedAt = Date.now();
    state = await command(operator, { type: "reveal_question" });

    const question = state.questions[state.currentQuestionIndex];
    const activeTables = state.tables.filter((table) => table.active);
    const correctTableIds = selectCorrectTableIds(activeTables);

    if (!question) {
      throw new Error(`No question found for round ${round}`);
    }

    await Promise.all(tables.map(async (table, index) => {
      const optionId = answerOptionForTable(question, table, correctTableIds);

      if (answerDelayMs > 0) {
        await sleep(answerDelayMs * index);
      }

      await command(
        table.client,
        { type: "submit_answer", tableId: table.id, optionId },
        table.id
      );
    }));

    const elapsedBeforeLockMs = Date.now() - roundStartedAt;
    const remainingRoundMs = Math.max(
      0,
      roundDurationSeconds * 1000 - elapsedBeforeLockMs
    );

    if (remainingRoundMs > 0) {
      await sleep(remainingRoundMs);
    }

    state = await command(operator, { type: "lock_round" });
    state = await command(operator, { type: "reveal_correct_answer" });
    state = await command(operator, { type: "apply_scores" });
    const powerUpUse = await maybeActivateRandomPowerUps(state, round);
    state = powerUpUse.state;

    const roundScoreEvents = state.scoreEvents.filter(
      (scoreEvent) => scoreEvent.roundNumber === round
    );
    const winners = roundScoreEvents
      .filter((scoreEvent) => scoreEvent.totalPoints > 0)
      .sort((left, right) => right.totalPoints - left.totalPoints);

    roundMetrics.push({
      round,
      elapsedMs: Date.now() - roundStartedAt,
      answered: roundScoreEvents.filter((scoreEvent) => scoreEvent.reason !== "no_answer").length,
      winners: winners.length,
      maxPoints: winners[0]?.totalPoints ?? 0,
      x2: powerUpUse.x2TableName,
      bomb: powerUpUse.bombLabel,
    });

    if (betweenRoundsMs > 0 && round < totalRounds) {
      await sleep(betweenRoundsMs);
    }
  }

  const finalState = await getState();
  const elapsedMs = Date.now() - startedAt;
  const ranking = [...finalState.tables]
    .filter((table) => table.active)
    .sort((left, right) => right.score - left.score)
    .slice(0, 5)
    .map((table, index) => `${index + 1}. ${table.name} (${table.score})`);

  console.log("");
  console.log("Resumen por ronda:");
  for (const metric of roundMetrics) {
    console.log(
      `R${metric.round}: ${(metric.elapsedMs / 1000).toFixed(2)}s | respondieron ${metric.answered}/${tableCount} | ganadoras ${metric.winners} | max ${metric.maxPoints}`
    );
    if (metric.x2 || metric.bomb) {
      console.log(
        `  comodines: ${metric.x2 ? `X2 ${metric.x2}` : "sin X2"} | ${
          metric.bomb ? `BOMBA ${metric.bomb}` : "sin BOMBA"
        }`
      );
    }
  }

  console.log("");
  console.log(`Tiempo total: ${(elapsedMs / 1000).toFixed(2)}s`);
  console.log(`Promedio por ronda: ${((elapsedMs / totalRounds) / 1000).toFixed(2)}s`);
  console.log("");
  console.log("Top 5 final:");
  for (const row of ranking) {
    console.log(row);
  }
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
