import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { NextResponse, type NextRequest } from "next/server";

import {
  hasOperatorAuthConfigured,
  hasValidOperatorSession,
} from "@/lib/server/operator-auth";

const execFileAsync = promisify(execFile);

/**
 * Ejecuta un checkpoint de contexto en entorno local.
 *
 * Nota:
 * - pensado para entorno de desarrollo con repo editable
 * - en serverless de produccion puede no tener permisos de escritura
 */
export async function POST(request: NextRequest) {
  if (hasOperatorAuthConfigured && !hasValidOperatorSession(request)) {
    return NextResponse.json(
      {
        error: "Sesion de operador requerida para actualizar el contexto.",
        unauthorized: true,
      },
      { status: 401 }
    );
  }

  try {
    await execFileAsync("node", ["scripts/context-checkpoint.mjs"], {
      cwd: process.cwd(),
    });

    return NextResponse.json({
      ok: true,
      message: "Context checkpoint actualizado.",
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "No se pudo ejecutar context checkpoint.";

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
