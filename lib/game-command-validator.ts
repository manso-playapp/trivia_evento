import type { GameCommand } from "@/types";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isOptionId = (value: unknown): value is "A" | "B" | "C" | "D" =>
  value === "A" || value === "B" || value === "C" || value === "D";

/**
 * Validador manual simple.
 * Evitamos dependencias extra en esta etapa y mantenemos la API legible.
 */
export const parseGameCommand = (input: unknown): GameCommand | null => {
  if (!isRecord(input) || typeof input.type !== "string") {
    return null;
  }

  switch (input.type) {
    case "reveal_question":
    case "start_round":
    case "lock_round":
    case "reveal_correct_answer":
    case "apply_scores":
    case "apply_freeze_for_round":
    case "reset_game":
    case "simulate_answers":
      return { type: input.type };

    case "submit_answer":
      if (typeof input.tableId === "string" && isOptionId(input.optionId)) {
        return {
          type: "submit_answer",
          tableId: input.tableId,
          optionId: input.optionId,
        };
      }

      return null;

    case "set_table_name":
      if (typeof input.tableId === "string" && typeof input.name === "string") {
        return {
          type: "set_table_name",
          tableId: input.tableId,
          name: input.name,
        };
      }

      return null;

    case "set_table_active":
      if (typeof input.tableId === "string" && typeof input.active === "boolean") {
        return {
          type: "set_table_active",
          tableId: input.tableId,
          active: input.active,
        };
      }

      return null;

    case "set_active_table_count":
      if (typeof input.count === "number" && Number.isInteger(input.count)) {
        return {
          type: "set_active_table_count",
          count: input.count,
        };
      }

      return null;

    case "activate_x2":
      if (typeof input.tableId === "string") {
        return { type: "activate_x2", tableId: input.tableId };
      }

      return null;

    case "activate_bomb":
      if (
        typeof input.sourceTableId === "string" &&
        typeof input.targetTableId === "string"
      ) {
        return {
          type: "activate_bomb",
          sourceTableId: input.sourceTableId,
          targetTableId: input.targetTableId,
        };
      }

      return null;

    default:
      return null;
  }
};
