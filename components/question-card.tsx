import type { AnswerOptionId, Question, RoundStatus } from "@/types";

type QuestionCardProps = {
  question: Question | null;
  roundStatus: RoundStatus;
  selectedOptionId?: AnswerOptionId | null;
};

export function QuestionCard({
  question,
  roundStatus,
  selectedOptionId,
}: QuestionCardProps) {
  if (!question) {
    return (
      <div className="broadcast-panel px-6 py-8">
        <p className="text-sm text-muted-foreground">
          La partida todavia no mostro la primera pregunta.
        </p>
      </div>
    );
  }

  return (
    <div className="broadcast-panel px-6 py-7 sm:px-8 sm:py-8">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5 text-[10px] font-semibold tracking-[0.2em] text-accent uppercase">
          Pregunta {question.order}
        </span>
        <span className="rounded-full border border-accent/20 bg-accent/8 px-3 py-1.5 text-[10px] font-semibold tracking-[0.2em] text-accent uppercase">
          {question.category}
        </span>
        {selectedOptionId ? (
          <span className="rounded-full border border-border/70 bg-background px-3 py-1.5 text-[10px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
            Mesa eligio {selectedOptionId}
          </span>
        ) : null}
        <span className="rounded-full border border-border/70 bg-background px-3 py-1.5 text-[10px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
          {roundStatus.replaceAll("_", " ")}
        </span>
      </div>

      <h2 className="max-w-5xl text-[2rem] font-semibold leading-[1.02] tracking-[-0.045em] text-foreground sm:text-5xl xl:text-6xl">
        {question.prompt}
      </h2>
    </div>
  );
}
