import type { RoundStatus } from "@/types";

export const roundStatusMeta: Record<
  RoundStatus,
  {
    label: string;
    description: string;
    tone: "neutral" | "accent" | "success" | "warning" | "danger";
  }
> = {
  idle: {
    label: "Espera",
    description: "Partida lista para comenzar.",
    tone: "neutral",
  },
  question_revealed: {
    label: "Pregunta visible",
    description: "La audiencia ya ve la pregunta; falta abrir respuestas.",
    tone: "accent",
  },
  round_active: {
    label: "Ronda activa",
    description: "Las mesas pueden responder o cambiar su respuesta.",
    tone: "success",
  },
  round_locked: {
    label: "Tiempo finalizado",
    description: "Las respuestas quedaron bloqueadas.",
    tone: "warning",
  },
  answer_revealed: {
    label: "Respuesta revelada",
    description: "La correcta ya se muestra en pantalla.",
    tone: "accent",
  },
  score_updated: {
    label: "Score actualizado",
    description: "Puntajes aplicados; lista la siguiente pregunta.",
    tone: "success",
  },
  game_finished: {
    label: "Juego terminado",
    description: "La partida termino y el ranking final ya esta definido.",
    tone: "danger",
  },
};
