import type { AnswerOptionId, Question, RoundStatus } from "@/types";

type AnswerOptionsBoardProps = {
  question: Question | null;
  roundStatus: RoundStatus;
  selectedOptionId?: AnswerOptionId | null;
  compact?: boolean;
};

export function AnswerOptionsBoard({
  question,
  roundStatus,
  selectedOptionId,
  compact = false,
}: AnswerOptionsBoardProps) {
  if (!question) {
    return null;
  }

  const revealCorrect =
    roundStatus === "answer_revealed" ||
    roundStatus === "score_updated" ||
    roundStatus === "game_finished";

  return (
    <div className={`grid sm:grid-cols-2 ${compact ? "gap-3" : "gap-3"}`}>
      {question.options.map((option) => {
        const isCorrect = option.id === question.correctOptionId;
        const isSelected = selectedOptionId === option.id;

        const optionClassName =
          revealCorrect && isCorrect
            ? "bg-success/14 shadow-[0_10px_22px_rgba(0,0,0,0.24)] ring-1 ring-success/35"
            : isSelected
              ? "bg-surface shadow-[0_12px_24px_rgba(0,0,0,0.28)] ring-1 ring-success/65"
              : "bg-surface/92 shadow-[0_10px_22px_rgba(0,0,0,0.24)]";

        return (
          <div
            key={option.id}
            className={`${compact ? "min-h-[5.8rem] rounded-[1.15rem] px-4 py-3.5" : "rounded-[1.3rem] p-4 sm:min-h-44 sm:p-6"} ${optionClassName}`}
          >
            <div className={`flex items-start justify-between gap-3 ${compact ? "mb-2.5" : "mb-4"}`}>
              <span
                className={`inline-flex items-center justify-center bg-background/80 font-semibold tracking-tight text-foreground ${compact ? "size-11 text-[1.85rem]" : "size-12 rounded-2xl text-2xl sm:size-14 sm:text-3xl"}`}
              >
                {option.label}
              </span>
              {revealCorrect && isCorrect ? (
                <span className="border border-success/35 bg-success/18 px-2 py-1 text-[10px] font-semibold tracking-[0.16em] text-success uppercase">
                  Correcta
                </span>
              ) : null}
            </div>
            <p className={`${compact ? "text-[1.05rem] leading-snug" : "text-lg leading-snug sm:text-xl"} text-foreground`}>
              {option.text}
            </p>
          </div>
        );
      })}
    </div>
  );
}
