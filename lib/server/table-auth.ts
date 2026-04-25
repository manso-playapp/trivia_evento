import "server-only";

import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { getTableAccessCode } from "@/lib/table-access";

export const TABLE_SESSION_COOKIE = "trivia_table_session";
const TABLE_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const TABLE_SESSION_SEPARATOR = ",";

const safeEqual = (left: string, right: string) => {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
};

/**
 * Codigo de acceso simple por mesa para el MVP.
 *
 * No pretende ser un sistema de auth final.
 * Sirve para que una URL sola no alcance para responder por cualquier mesa.
 *
 * Regla actual:
 * - Mesa 1 => 1001
 * - Mesa 2 => 1002
 * - ...
 * - Mesa 20 => 1020
 */
export const isValidTableAccessCode = (tableId: string, accessCode: string) => {
  const expectedCode = getTableAccessCode(tableId);

  if (!expectedCode) {
    return false;
  }

  return safeEqual(expectedCode, accessCode);
};

const parseAuthenticatedTableIds = (cookieValue: string | null) =>
  (cookieValue ?? "")
    .split(TABLE_SESSION_SEPARATOR)
    .map((value) => value.trim())
    .filter(Boolean);

const serializeAuthenticatedTableIds = (tableIds: string[]) =>
  Array.from(new Set(tableIds)).sort().join(TABLE_SESSION_SEPARATOR);

export const getAuthenticatedTableIds = (request: NextRequest) =>
  parseAuthenticatedTableIds(request.cookies.get(TABLE_SESSION_COOKIE)?.value ?? null);

export const getAuthenticatedTableId = (request: NextRequest) =>
  getAuthenticatedTableIds(request)[0] ?? null;

export const hasValidTableSession = (request: NextRequest, tableId: string) => {
  return getAuthenticatedTableIds(request).some((authenticatedTableId) =>
    safeEqual(authenticatedTableId, tableId)
  );
};

export const applyTableSessionCookie = (
  response: NextResponse,
  tableId: string,
  existingTableIds: string[] = []
) => {
  response.cookies.set(
    TABLE_SESSION_COOKIE,
    serializeAuthenticatedTableIds([...existingTableIds, tableId]),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: TABLE_SESSION_MAX_AGE_SECONDS,
    }
  );
};

export const removeTableSessionCookie = (
  response: NextResponse,
  tableId: string,
  existingTableIds: string[] = []
) => {
  const nextTableIds = existingTableIds.filter(
    (authenticatedTableId) => !safeEqual(authenticatedTableId, tableId)
  );

  if (nextTableIds.length === 0) {
    clearTableSessionCookie(response);
    return;
  }

  response.cookies.set(
    TABLE_SESSION_COOKIE,
    serializeAuthenticatedTableIds(nextTableIds),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: TABLE_SESSION_MAX_AGE_SECONDS,
    }
  );
};

export const clearTableSessionCookie = (response: NextResponse) => {
  response.cookies.set(TABLE_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
};
