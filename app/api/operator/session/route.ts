import { NextResponse, type NextRequest } from "next/server";
import {
  applyOperatorSessionCookie,
  clearOperatorSessionCookie,
  hasOperatorAuthConfigured,
  hasValidOperatorSession,
  isValidOperatorToken,
} from "@/lib/server/operator-auth";

type SessionRequestBody = {
  token?: unknown;
};

/**
 * Sesion minima de operador para el MVP endurecido.
 *
 * No reemplaza auth real. Sirve para evitar que cualquier cliente dispare
 * comandos administrativos cuando usamos writes por backend.
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    enabled: hasOperatorAuthConfigured,
    authenticated: hasValidOperatorSession(request),
  });
}

export async function POST(request: NextRequest) {
  if (!hasOperatorAuthConfigured) {
    return NextResponse.json(
      {
        error:
          "Falta TRIVIA_OPERATOR_API_TOKEN en el servidor. No se puede abrir sesion de operador.",
      },
      { status: 503 }
    );
  }

  let body: SessionRequestBody;

  try {
    body = (await request.json()) as SessionRequestBody;
  } catch {
    return NextResponse.json({ error: "Body JSON invalido." }, { status: 400 });
  }

  const token = typeof body.token === "string" ? body.token : "";

  if (!isValidOperatorToken(token)) {
    return NextResponse.json(
      { error: "Token de operador invalido." },
      { status: 401 }
    );
  }

  const response = NextResponse.json({ authenticated: true });
  applyOperatorSessionCookie(response);
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ authenticated: false });
  clearOperatorSessionCookie(response);
  return response;
}
