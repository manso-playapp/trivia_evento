import { NextResponse, type NextRequest } from "next/server";
import { executeGameCommand } from "@/engine/game-command-runner";
import { getCurrentQuestion, getCurrentRoundNumber } from "@/engine/game-selectors";
import { parseGameCommand } from "@/lib/game-command-validator";
import {
  hasOperatorAuthConfigured,
  hasValidOperatorSession,
  isOperatorCommand,
} from "@/lib/server/operator-auth";
import {
  applyTableSessionCookie,
  getAuthenticatedTableId,
} from "@/lib/server/table-auth";
import {
  hasSupabaseAdminCredentials,
  serverRuntimeConfig,
} from "@/lib/server/runtime-config";
import {
  clearSubmittedAnswersForGame,
  GameStateConflictError,
  persistServerGameTransition,
  readOrSeedServerGameState,
  upsertSubmittedAnswer,
} from "@/lib/server/game-session-store";
import { createGameEvent } from "@/services/game-service";

type CommandRequestBody = {
  command?: unknown;
  actorId?: unknown;
  expectedRevision?: unknown;
};

const resolveActorId = (bodyActorId: unknown, fallback: string) =>
  typeof bodyActorId === "string" && bodyActorId.trim().length > 0
    ? bodyActorId
    : fallback;

const parseExpectedRevision = (value: unknown) =>
  typeof value === "number" && Number.isInteger(value) && value >= 0
    ? value
    : null;

export async function POST(request: NextRequest) {
  if (!hasSupabaseAdminCredentials) {
    return NextResponse.json(
      {
        error:
          "Falta SUPABASE_SERVICE_ROLE_KEY en el servidor. Usa modo direct o configura backend writes.",
      },
      { status: 503 }
    );
  }

  let body: CommandRequestBody;

  try {
    body = (await request.json()) as CommandRequestBody;
  } catch {
    return NextResponse.json({ error: "Body JSON invalido." }, { status: 400 });
  }

  const command = parseGameCommand(body.command);

  if (!command) {
    return NextResponse.json({ error: "Comando invalido." }, { status: 400 });
  }

  if (isOperatorCommand(command) && hasOperatorAuthConfigured) {
    if (!hasValidOperatorSession(request)) {
      return NextResponse.json(
        {
          error: "Sesion de operador requerida para este comando.",
          unauthorized: true,
        },
        { status: 401 }
      );
    }
  }

  if (command.type === "submit_answer") {
    // La cookie httpOnly es la fuente de verdad del tableId.
    // Ignoramos command.tableId del body para que un cliente no pueda votar
    // por otra mesa aunque tenga una sesión válida para varias.
    const sessionTableId = getAuthenticatedTableId(request);

    if (!sessionTableId) {
      return NextResponse.json(
        {
          error: "Sesion valida de mesa requerida para responder.",
          unauthorized: true,
        },
        { status: 401 }
      );
    }

    // Fast path: no revision system, upsert atomico por (game_id, table_id, round_number).
    // Cada mesa tiene su propia fila → no hay conflictos entre mesas concurrentes.
    try {
      const currentState = await readOrSeedServerGameState(
        serverRuntimeConfig.supabaseGameId
      );

      if (currentState.roundStatus !== "round_active") {
        return NextResponse.json({ ignored: true });
      }

      const question = getCurrentQuestion(currentState);

      if (!question) {
        return NextResponse.json({ ignored: true });
      }

      const table = currentState.tables.find((t) => t.id === sessionTableId);

      if (!table?.active) {
        return NextResponse.json({ ignored: true });
      }

      await upsertSubmittedAnswer({
        gameId: serverRuntimeConfig.supabaseGameId,
        tableId: sessionTableId,
        questionId: question.id,
        roundNumber: getCurrentRoundNumber(currentState),
        optionId: command.optionId,
      });

      const response = NextResponse.json({ success: true });
      applyTableSessionCookie(response, sessionTableId);
      return response;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error al guardar respuesta.";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  try {
    const currentState = await readOrSeedServerGameState(
      serverRuntimeConfig.supabaseGameId
    );
    const expectedRevision = parseExpectedRevision(body.expectedRevision);

    if (expectedRevision !== null && expectedRevision !== currentState.revision) {
      return NextResponse.json(
        {
          error: "Revision desactualizada. Recarga el estado antes de reintentar.",
          state: currentState,
          conflict: true,
        },
        { status: 409 }
      );
    }

    const execution = executeGameCommand(currentState, command);

    if (execution.nextState === currentState) {
      return NextResponse.json({
        state: currentState,
        ignored: true,
      });
    }

    const actorId = resolveActorId(body.actorId, execution.actorRole);
    const event = createGameEvent({
      gameId: currentState.gameId,
      type: execution.eventType,
      actorRole: execution.actorRole,
      actorId,
      payload: execution.payload,
    });

    const nextState = {
      ...execution.nextState,
      gameId: currentState.gameId,
      revision: currentState.revision + 1,
      lastEvent: event,
    };

    // Limpiar answers antes de persistir el reset: si falla el clear,
    // el comando entero falla y el state no queda reseteado con huérfanas.
    if (command.type === "reset_game") {
      await clearSubmittedAnswersForGame(serverRuntimeConfig.supabaseGameId);
    }

    await persistServerGameTransition({
      state: nextState,
      event,
      expectedRevision: currentState.revision,
    });

    return NextResponse.json({
      state: nextState,
      ignored: false,
    });
  } catch (error) {
    if (error instanceof GameStateConflictError) {
      return NextResponse.json(
        {
          error: error.message,
          state: error.currentState,
          conflict: true,
        },
        { status: 409 }
      );
    }

    const message =
      error instanceof Error ? error.message : "Error inesperado en comando.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
