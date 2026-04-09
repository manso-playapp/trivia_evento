import "server-only";

import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { getTableAccessCode } from "@/lib/table-access";

export const TABLE_SESSION_COOKIE = "trivia_table_session";

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

export const getAuthenticatedTableId = (request: NextRequest) =>
  request.cookies.get(TABLE_SESSION_COOKIE)?.value ?? null;

export const hasValidTableSession = (request: NextRequest, tableId: string) => {
  const cookieValue = getAuthenticatedTableId(request);

  if (!cookieValue) {
    return false;
  }

  return safeEqual(cookieValue, tableId);
};

export const applyTableSessionCookie = (
  response: NextResponse,
  tableId: string
) => {
  response.cookies.set(TABLE_SESSION_COOKIE, tableId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
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
