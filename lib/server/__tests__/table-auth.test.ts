/**
 * Tests de política de identidad de mesa.
 *
 * Invariante del sistema: un dispositivo = una mesa durante todo el evento.
 * La cookie `trivia_table_session` almacena UN ÚNICO table_id. Intentar
 * autenticarse como una mesa distinta a la ya registrada debe fallar con
 * error explícito, no acumular IDs.
 *
 * Qué prueba cada test:
 *
 * T4: getAuthenticatedTableId devuelve el table_id cuando la cookie es válida.
 * T5: getAuthenticatedTableId devuelve null cuando no hay cookie.
 * T1: Un dispositivo sin cookie puede autenticarse como mesa X → cookie = X.
 * T2: Un dispositivo con cookie de mesa X NO puede autenticarse como mesa Y
 *     → rechazado con error, cookie sin cambiar. [Reproduce el bug de T-VAL]
 * T3: Un dispositivo con cookie de mesa X puede re-autenticarse como mesa X
 *     (idempotente) → éxito, cookie permanece igual.
 */

import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { getAuthenticatedTableId } from "@/lib/server/table-auth";
import { POST } from "@/app/api/table/session/route";

// --- Helpers ---

function makeRequest(
  method: "GET" | "POST",
  body: Record<string, string> | null,
  cookieTableId: string | null
): NextRequest {
  const headers: Record<string, string> = {};
  if (cookieTableId) {
    headers["cookie"] = `trivia_table_session=${cookieTableId}`;
  }
  if (body) {
    headers["content-type"] = "application/json";
  }
  return new NextRequest("http://localhost/api/table/session", {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}

// --- T4 & T5: getAuthenticatedTableId ---

describe("getAuthenticatedTableId", () => {
  it("T4: devuelve el table_id cuando la cookie tiene un valor válido", () => {
    const req = makeRequest("GET", null, "table-2");
    expect(getAuthenticatedTableId(req)).toBe("table-2");
  });

  it("T5: devuelve null cuando la cookie está ausente", () => {
    const req = makeRequest("GET", null, null);
    expect(getAuthenticatedTableId(req)).toBeNull();
  });
});

// --- T1–T3: POST /api/table/session ---

describe("POST /api/table/session — 1 dispositivo = 1 mesa", () => {
  it("T1: dispositivo sin cookie puede autenticarse como mesa X", async () => {
    const req = makeRequest("POST", { tableId: "table-2", accessCode: "1002" }, null);
    const res = await POST(req);

    expect(res.status).toBe(200);
    // La respuesta debe registrar exactamente ese table_id en la cookie
    expect(res.cookies.get("trivia_table_session")?.value).toBe("table-2");
  });

  it("T2: dispositivo con cookie de mesa X no puede autenticarse como mesa Y", async () => {
    // Este test reproduce el bug de T-VAL:
    // Mesa 4 ya tenía cookie de mesa 2 → sus submits se atribuían a mesa 2.
    const req = makeRequest(
      "POST",
      { tableId: "table-4", accessCode: "1004" },
      "table-2"  // ← cookie existente de una mesa distinta
    );
    const res = await POST(req);

    // Debe rechazar: el dispositivo ya tiene identidad de mesa 2, no puede ser mesa 4
    expect(res.status).toBe(409);

    const body = (await res.json()) as { error?: string };
    expect(body.error).toBeDefined();

    // No debe emitir Set-Cookie que mezcle o reemplace la identidad
    expect(res.cookies.get("trivia_table_session")).toBeUndefined();
  });

  it("T3: dispositivo con cookie de mesa X puede re-autenticarse como mesa X (idempotente)", async () => {
    const req = makeRequest(
      "POST",
      { tableId: "table-2", accessCode: "1002" },
      "table-2"  // ← misma mesa que la cookie existente
    );
    const res = await POST(req);

    // Re-autenticarse en la misma mesa es válido (ej: recarga de página)
    expect(res.status).toBe(200);
    expect(res.cookies.get("trivia_table_session")?.value).toBe("table-2");
  });
});
