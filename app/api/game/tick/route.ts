import { NextResponse } from "next/server";
import {
  GameStateConflictError,
} from "@/lib/server/game-session-store";
import { runServerGameAutomationTick } from "@/lib/server/game-automation";
import {
  hasSupabaseAdminCredentials,
} from "@/lib/server/runtime-config";

/**
 * Tick de backend para automatismos simples del juego.
 *
 * En esta etapa:
 * - cierra la ronda cuando el tiempo ya vencio
 * - revela la correcta y aplica scoring con delays simples
 * - no depende de que el operador pulse cada boton manualmente
 *
 * Produccion mas adelante:
 * - mover esto a scheduler, cron o worker persistente
 * - sumar reveal/scoring automáticos si el formato lo requiere
 */
export async function POST() {
  if (!hasSupabaseAdminCredentials) {
    return NextResponse.json(
      {
        error:
          "Falta SUPABASE_SERVICE_ROLE_KEY en el servidor. El tick automatico no esta habilitado.",
      },
      { status: 503 }
    );
  }

  try {
    const result = await runServerGameAutomationTick();

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof GameStateConflictError) {
      return NextResponse.json(
        {
          state: error.currentState,
          advanced: false,
          conflict: true,
        },
        { status: 409 }
      );
    }

    const message =
      error instanceof Error ? error.message : "Error inesperado en game tick.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
