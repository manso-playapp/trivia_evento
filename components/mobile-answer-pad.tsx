"use client";

import { Button } from "@/components/ui/button";
import type { AnswerOptionId, Question } from "@/types";

type MobileAnswerPadProps = {
  question: Question | null;
  selectedOptionId: AnswerOptionId | null;
  disabled: boolean;
  frozen: boolean;
  onSelect: (optionId: AnswerOptionId) => void;
};

export function MobileAnswerPad({
  question,
  selectedOptionId,
  disabled,
  frozen,
  onSelect,
}: MobileAnswerPadProps) {
  if (!question) {
    return null;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {question.options.map((option) => {
        const isSelected = selectedOptionId === option.id;

        return (
          <Button
            key={option.id}
            onClick={() => onSelect(option.id)}
            disabled={disabled || frozen}
            variant={isSelected ? "default" : "outline"}
            className="h-auto min-h-32 flex-col items-start justify-start rounded-[1.35rem] px-5 py-5 text-left sm:min-h-36"
          >
            <span className="mb-3 inline-flex size-12 items-center justify-center rounded-2xl bg-background/55 text-3xl font-semibold tracking-tight">
              {option.label}
            </span>
            <span className="text-base leading-snug whitespace-normal sm:text-lg">
              {option.text}
            </span>
          </Button>
        );
      })}
    </div>
  );
}
