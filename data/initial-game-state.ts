import { mockQuestions } from "@/data/mock-questions";
import { mockTables } from "@/data/mock-tables";
import { defaultSoundSettings } from "@/data/default-sound-settings";
import type { GameState } from "@/types";

const INITIAL_STATE_TIMESTAMP = "2026-01-01T00:00:00.000Z";

/**
 * Estado inicial reusable para resetear el MVP.
 * Usamos un timestamp fijo y valido para evitar diferencias SSR/cliente y para
 * que el reset del juego sea persistible en Supabase.
 */
export const createInitialGameState = (): GameState => ({
  gameId: "trivia-evento-mvp",
  revision: 0,
  eventName: "Trivia Evento",
  eventTagline: "Corporate Live Challenge",
  publicScreenWidthPx: 1356,
  publicScreenHeightPx: 768,
  soundSettings: defaultSoundSettings,
  totalRounds: mockQuestions.length,
  currentQuestionIndex: null,
  roundStatus: "idle",
  roundDurationSeconds: 30,
  roundEndsAt: null,
  questions: JSON.parse(JSON.stringify(mockQuestions)) as GameState["questions"],
  tables: JSON.parse(JSON.stringify(mockTables)) as GameState["tables"],
  tiebreakerTableIds: [],
  submittedAnswers: [],
  scoreEvents: [],
  powerUpsEnabled: false,
  scoreAdjustments: [],
  updatedAt: INITIAL_STATE_TIMESTAMP,
  lastEvent: null,
});

export const initialGameState = createInitialGameState();
