import "server-only";

import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { serverRuntimeConfig } from "@/lib/server/runtime-config";
import type { GameCommand } from "@/types";

export const OPERATOR_SESSION_COOKIE = "trivia_operator_session";

const safeEqual = (left: string, right: string) => {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
};

export const hasOperatorAuthConfigured = Boolean(
  serverRuntimeConfig.operatorAuthEnabled && serverRuntimeConfig.operatorApiToken
);

export const isOperatorCommand = (command: GameCommand) =>
  command.type !== "submit_answer";

export const hasValidOperatorSession = (request: NextRequest) => {
  if (!hasOperatorAuthConfigured) {
    return false;
  }

  const cookieValue = request.cookies.get(OPERATOR_SESSION_COOKIE)?.value;

  if (!cookieValue) {
    return false;
  }

  return safeEqual(cookieValue, serverRuntimeConfig.operatorApiToken);
};

export const isValidOperatorToken = (token: string) => {
  if (!hasOperatorAuthConfigured) {
    return false;
  }

  return safeEqual(token, serverRuntimeConfig.operatorApiToken);
};

export const applyOperatorSessionCookie = (response: NextResponse) => {
  response.cookies.set(OPERATOR_SESSION_COOKIE, serverRuntimeConfig.operatorApiToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
};

export const clearOperatorSessionCookie = (response: NextResponse) => {
  response.cookies.set(OPERATOR_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
};
