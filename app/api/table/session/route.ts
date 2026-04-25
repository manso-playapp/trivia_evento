import { NextResponse, type NextRequest } from "next/server";
import {
  applyTableSessionCookie,
  clearTableSessionCookie,
  getAuthenticatedTableId,
  getAuthenticatedTableIds,
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
    applyTableSessionCookie(response, tableId, getAuthenticatedTableIds(request));
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

  const response = NextResponse.json({
    authenticated: true,
    tableId,
  });
  applyTableSessionCookie(response, tableId, getAuthenticatedTableIds(request));
  return response;
}

export async function DELETE(request: NextRequest) {
  const tableId = request.nextUrl.searchParams.get("tableId");
  const response = NextResponse.json({ authenticated: false });

  if (tableId) {
    removeTableSessionCookie(response, tableId, getAuthenticatedTableIds(request));
    return response;
  }

  clearTableSessionCookie(response);
  return response;
}
