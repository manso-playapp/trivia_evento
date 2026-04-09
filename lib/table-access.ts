import { runtimeConfig } from "@/lib/runtime-config";

/**
 * Helpers compartidos para acceso por mesa.
 *
 * Esta capa evita duplicar reglas entre servidor, operador y vista mobile.
 * Mas adelante se puede reemplazar por credenciales reales emitidas por backend.
 */
export const extractTableNumber = (tableId: string) => {
  const match = /^table-(\d+)$/.exec(tableId);

  if (!match) {
    return null;
  }

  return Number(match[1]);
};

export const getTableAccessCode = (tableId: string) => {
  const tableNumber = extractTableNumber(tableId);

  if (!tableNumber) {
    return null;
  }

  return String(1000 + tableNumber);
};

export const getTableJoinPath = (tableId: string, accessCode?: string | null) => {
  const params = new URLSearchParams();

  if (accessCode) {
    params.set("code", accessCode);
  }

  const queryString = params.toString();

  return `/play/${tableId}${queryString ? `?${queryString}` : ""}`;
};

export const getTableJoinUrl = ({
  tableId,
  accessCode,
  origin,
}: {
  tableId: string;
  accessCode?: string | null;
  origin?: string | null;
}) => {
  const baseUrl = origin ?? runtimeConfig.appUrl ?? "";
  const joinPath = getTableJoinPath(tableId, accessCode);

  if (!baseUrl) {
    return joinPath;
  }

  return new URL(joinPath, baseUrl).toString();
};
