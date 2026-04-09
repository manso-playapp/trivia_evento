import "server-only";

import type { NextRequest } from "next/server";

/**
 * Autenticacion minima para schedulers HTTP.
 *
 * Vercel Cron envia `Authorization: Bearer <CRON_SECRET>` si existe la env.
 * Dejamos el chequeo en un helper para poder reutilizarlo con otros schedulers.
 */
export const hasValidCronAuthorization = (request: NextRequest) => {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return false;
  }

  return request.headers.get("authorization") === `Bearer ${secret}`;
};
