import type { Question } from "@/types/question";
import type { GameEvent } from "@/types/game-event";
import type { RoundStatus } from "@/types/round-status";
import type { ScoreEvent } from "@/types/score-event";
import type { SoundSettings } from "@/types/sound-settings";
import type { SubmittedAnswer } from "@/types/submitted-answer";
import type { Table } from "@/types/table";

/**
 * Estado unico del juego.
 * Hoy vive en storage local; mas adelante puede venir de un backend realtime.
 */
export type GameState = {
  gameId: string;
  revision: number;
  eventName: string;
  eventTagline: string;
  publicScreenWidthPx: number;
  publicScreenHeightPx: number;
  soundSettings: SoundSettings;
  totalRounds: number;
  currentQuestionIndex: number | null;
  roundStatus: RoundStatus;
  roundDurationSeconds: number;
  roundEndsAt: string | null;
  questions: Question[];
  tables: Table[];
  tiebreakerTableIds?: string[];
  submittedAnswers: SubmittedAnswer[];
  scoreEvents: ScoreEvent[];
  updatedAt: string;
  lastEvent: GameEvent | null;
};
