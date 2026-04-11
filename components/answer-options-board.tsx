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
    <div className={`grid sm:grid-cols-2 ${compact ? "gap-2" : "gap-3"}`}>
      {question.options.map((option) => {
        const isCorrect = option.id === question.correctOptionId;
        const isSelected = selectedOptionId === option.id;

        const optionClassName =
          revealCorrect && isCorrect
            ? "border-success/35 bg-success/10 shadow-[0_0_0_1px_rgba(49,208,126,0.1)_inset]"
            : isSelected
              ? "border-accent/35 bg-accent/10 shadow-[0_0_0_1px_rgba(97,155,255,0.1)_inset]"
              : "border-border/70 bg-surface/95";

        return (
          <div
            key={option.id}
            className={`rounded-[1.3rem] border ${compact ? "p-3 sm:min-h-24" : "p-4 sm:min-h-44 sm:p-6"} ${optionClassName}`}
          >
            <div className={`flex items-start justify-between gap-3 ${compact ? "mb-2" : "mb-4"}`}>
              <span
                className={`inline-flex items-center justify-center rounded-2xl bg-background/80 font-semibold tracking-tight text-foreground ${compact ? "size-10 text-xl" : "size-12 text-2xl sm:size-14 sm:text-3xl"}`}
              >
                {option.label}
              </span>
              {revealCorrect && isCorrect ? (
                <span className="rounded-full border border-success/30 bg-success/14 px-3 py-1.5 text-[10px] font-semibold tracking-[0.18em] text-success uppercase">
                  Correcta
                </span>
              ) : null}
            </div>
            <p className={`${compact ? "text-base leading-snug" : "text-lg leading-snug sm:text-xl"} text-foreground`}>
              {option.text}
            </p>
          </div>
        );
      })}
    </div>
  );
}
