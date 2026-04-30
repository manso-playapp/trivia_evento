import type { PowerUpType } from "@/types/power-up";

export type ScoreAdjustmentReason =
  | { kind: "manual_points"; delta: number }
  | { kind: "power_up_restored"; powerUpType: PowerUpType };

export type ScoreAdjustment = {
  id: string;
  tableId: string;
  tableName: string;
  reason: ScoreAdjustmentReason;
  appliedAt: string;
  roundNumber: number | null;
};
