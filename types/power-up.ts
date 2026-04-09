export type PowerUpType = "x2" | "bomb";
export type PowerUpStatus = "available" | "armed" | "spent";

/**
 * Estado serializable de cada comodin.
 * Se guarda en la mesa para que sea facil mostrarlo en cualquier vista.
 */
export type PowerUp = {
  type: PowerUpType;
  label: string;
  description: string;
  status: PowerUpStatus;
  armedForRound: number | null;
  targetTableId: string | null;
  usedAtRound: number | null;
};
