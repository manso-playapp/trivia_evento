/**
 * Decide si un evento Realtime de submitted_answers debe aplicarse al estado local.
 *
 * ownTableId es null para el operador (sin cookie de mesa): recibe todos los
 * eventos del game. Para clientes de mesa, es el table_id propio registrado en
 * la cookie trivia_table_session — ver decisión de modelo "un dispositivo = una mesa".
 *
 * El filtro server-side (Supabase Realtime) ya debería descartar lo ajeno, pero
 * esta función actúa como cinturón de seguridad: si el filtro falla por migración
 * o reconexión, el estado local no se corrompe.
 */
export function shouldApplyIncomingAnswer(
  rowTableId: string,
  ownTableId: string | null
): boolean {
  return !ownTableId || rowTableId === ownTableId;
}
