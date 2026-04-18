import type { ReactNode } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type SectionCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export function SectionCard({
  title,
  description,
  children,
  className,
}: SectionCardProps) {
  return (
    <Card className={cn("broadcast-panel", className)}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg tracking-tight text-foreground">
          {title}
        </CardTitle>
        {description ? (
          <CardDescription className="max-w-3xl text-sm leading-relaxed">
            {description}
          </CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="pt-3 sm:pt-4">{children}</CardContent>
    </Card>
  );
}
