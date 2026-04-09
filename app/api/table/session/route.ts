import { NextResponse, type NextRequest } from "next/server";
import {
  applyTableSessionCookie,
  clearTableSessionCookie,
  getAuthenticatedTableId,
  hasValidTableSession,
  isValidTableAccessCode,
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

  return NextResponse.json({
    authenticated: tableId ? hasValidTableSession(request, tableId) : false,
    tableId: getAuthenticatedTableId(request),
  });
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
  applyTableSessionCookie(response, tableId);
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ authenticated: false });
  clearTableSessionCookie(response);
  return response;
}
