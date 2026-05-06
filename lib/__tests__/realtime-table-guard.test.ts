/**
 * Tests del guard cliente de Realtime (shouldApplyIncomingAnswer).
 *
 * Qué prueba cada test:
 *
 * G1: evento de la mesa propia → se aplica.
 * G2: evento de otra mesa con ownTableId conocido → descartado (cinturón de seguridad).
 * G3: ownTableId es null (operador) → todos los eventos se aplican.
 */

import { describe, it, expect } from "vitest";
import { shouldApplyIncomingAnswer } from "@/lib/realtime-table-guard";

describe("shouldApplyIncomingAnswer", () => {
  it("G1: evento de la mesa propia se aplica", () => {
    expect(shouldApplyIncomingAnswer("table-2", "table-2")).toBe(true);
  });

  it("G2: evento de otra mesa es descartado cuando ownTableId está definido", () => {
    expect(shouldApplyIncomingAnswer("table-4", "table-2")).toBe(false);
  });

  it("G3: operador (ownTableId null) recibe eventos de cualquier mesa", () => {
    expect(shouldApplyIncomingAnswer("table-4", null)).toBe(true);
    expect(shouldApplyIncomingAnswer("table-17", null)).toBe(true);
  });
});
