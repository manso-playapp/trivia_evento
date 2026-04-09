import type { PowerUp, Table } from "@/types";

const createPowerUps = (): PowerUp[] => [
  {
    type: "x2",
    label: "X2",
    description: "Duplica los puntos de la ronda actual si la mesa responde bien.",
    status: "available",
    armedForRound: null,
    targetTableId: null,
    usedAtRound: null,
  },
  {
    type: "bomb",
    label: "BOMBA",
    description: "Congela a otra mesa durante la proxima ronda.",
    status: "available",
    armedForRound: null,
    targetTableId: null,
    usedAtRound: null,
  },
];

export const mockTables: Table[] = Array.from({ length: 20 }, (_, index) => ({
  id: `table-${index + 1}`,
  name: `Mesa ${index + 1}`,
  score: 0,
  connected: true,
  powerUps: createPowerUps(),
  frozenRoundNumber: null,
  frozenByTableId: null,
}));
