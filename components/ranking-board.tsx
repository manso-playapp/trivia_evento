import { Medal } from "lucide-react";

import type { Table } from "@/types";

type RankingBoardProps = {
  ranking: Table[];
  limit?: number;
  compact?: boolean;
};

export function RankingBoard({
  ranking,
  limit = 10,
  compact = false,
}: RankingBoardProps) {
  const topTables = ranking.slice(0, limit);
  const compactRowsStyle = topTables.length
    ? { gridTemplateRows: `repeat(${topTables.length}, minmax(0, 1fr))` }
    : undefined;

  if (compact) {
    return (
      <div className="flex h-full flex-col px-0.5 py-0.5">
        <div className="mb-2 flex items-center gap-2">
          <Medal className="size-3.5 text-accent" />
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            Top {limit}
          </h3>
        </div>

        <div className="grid min-h-0 flex-1 gap-1" style={compactRowsStyle}>
          {topTables.map((table, index) => (
            <div
              key={table.id}
              className={`flex h-full items-center justify-between rounded-[0.5rem] border px-2 py-1 ${
                index === 0
                  ? "border-accent/45 bg-accent/14"
                  : "border-border/60 bg-background/55"
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="flex size-6 items-center justify-center bg-background/80 text-xs font-semibold text-foreground">
                  {index + 1}
                </div>
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-foreground">
                  {table.name}
                </p>
              </div>
              <p className="text-base font-semibold leading-none tabular-nums text-foreground">
                {table.score}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="broadcast-panel px-5 py-5">
      <div className="mb-4 flex items-center gap-2">
        <Medal className="size-4 text-accent" />
        <h3 className="text-xl font-semibold tracking-tight text-foreground">
          Top ranking
        </h3>
      </div>

      <div className="space-y-3">
        {topTables.map((table, index) => (
          <div
            key={table.id}
            className={`flex items-center justify-between rounded-[1.1rem] border ${
              "px-4 py-3.5"
            } ${
              index === 0
                ? "border-accent/35 bg-accent/10"
                : "border-border/60 bg-background/70"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex size-11 items-center justify-center rounded-2xl bg-background/80 text-lg font-semibold tracking-tight text-foreground"
              >
                {index + 1}
              </div>
              <div>
                <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">
                #{index + 1}
                </p>
                <p className="text-base font-semibold text-foreground sm:text-lg">
                  {table.name}
                </p>
              </div>
            </div>
            <p className="text-3xl font-semibold tracking-tight text-foreground">
              {table.score}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
