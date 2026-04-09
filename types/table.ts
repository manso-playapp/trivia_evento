import type { PowerUp } from "@/types/power-up";

/**
 * Cada mesa es un equipo del evento.
 */
export type Table = {
  id: string;
  name: string;
  score: number;
  connected: boolean;
  powerUps: PowerUp[];
  frozenRoundNumber: number | null;
  frozenByTableId: string | null;
};
