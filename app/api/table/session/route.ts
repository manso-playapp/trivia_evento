import { NextResponse, type NextRequest } from "next/server";
import {
  applyTableSessionCookie,
  clearTableSessionCookie,
  getAuthenticatedTableId,
  hasValidTableSession,
  isValidTableAccessCode,
  removeTableSessionCookie,
} from "@/lib/server/table-auth";

type TableSessionRequestBody = {
  tableId?: unknown;
  accessCode?: unknown;
};

/**
 * Sesion minima de mesa.
 * Protege `submit_answer` sin meter auth completa todavia.
 */
export async function GET(request: NextRequest) {
  const tableId = request.nextUrl.searchParams.get("tableId");
  const authenticated = tableId ? hasValidTableSession(request, tableId) : false;
  const response = NextResponse.json({
    authenticated,
    tableId: getAuthenticatedTableId(request),
  });

  if (authenticated && tableId) {
    applyTableSessionCookie(response, tableId);
  }

  return response;
}

export async function POST(request: NextRequest) {
  let body: TableSessionRequestBody;

  try {
    body = (await request.json()) as TableSessionRequestBody;
  } catch {
    return NextResponse.json({ error: "Body JSON invalido." }, { status: 400 });
  }

  const tableId = typeof body.tableId === "string" ? body.tableId : "";
  const accessCode = typeof body.accessCode === "string" ? body.accessCode : "";

  if (!isValidTableAccessCode(tableId, accessCode)) {
    return NextResponse.json(
      { error: "Codigo de mesa invalido." },
      { status: 401 }
    );
  }

  // Un dispositivo = una mesa durante todo el evento.
  // Si ya hay sesión activa para otra mesa, rechazar con conflicto explícito.
  const existingTableId = getAuthenticatedTableId(request);
  if (existingTableId && existingTableId !== tableId) {
    return NextResponse.json(
      {
        error: `Este dispositivo ya tiene una sesión activa para ${existingTableId}. Cerrá esa sesión antes de autenticarte como otra mesa.`,
        conflictingTableId: existingTableId,
      },
      { status: 409 }
    );
  }

  const response = NextResponse.json({
    authenticated: true,
    tableId,
  });
  applyTableSessionCookie(response, tableId);
  return response;
}

export async function DELETE(request: NextRequest) {
  const tableId = request.nextUrl.searchParams.get("tableId");
  const response = NextResponse.json({ authenticated: false });

  if (tableId) {
    // Solo borrar si la sesión activa corresponde a esa mesa.
    if (hasValidTableSession(request, tableId)) {
      removeTableSessionCookie(response);
    }
    return response;
  }

  clearTableSessionCookie(response);
  return response;
}
