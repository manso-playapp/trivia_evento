export type AnswerOptionId = "A" | "B" | "C" | "D";

/**
 * Opcion visible para preguntas de multiple choice.
 */
export type AnswerOption = {
  id: AnswerOptionId;
  label: AnswerOptionId;
  text: string;
};
