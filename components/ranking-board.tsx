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
        <div className="mb-2.5 flex items-center gap-2">
          <Medal className="size-4 text-accent" />
          <h3 className="text-lg font-semibold tracking-tight text-foreground">
            Top {limit}
          </h3>
        </div>

        <div className="grid min-h-0 flex-1 gap-1.5" style={compactRowsStyle}>
          {topTables.map((table, index) => {
            const isLeaderWithPresence =
              index === 0 && (table.name.trim().length > 0 || table.score !== 0);
            const rowClassName = isLeaderWithPresence
              ? "border-accent/45 bg-accent/14 shadow-[0_10px_22px_rgba(0,0,0,0.24)]"
              : "border-border/60 bg-surface/92 shadow-[0_10px_22px_rgba(0,0,0,0.24)]";
            const positionClassName = isLeaderWithPresence
              ? "border-accent/30 text-accent"
              : "border-white/10 text-foreground";

            return (
              <div
                key={table.id}
                className={`grid h-full min-w-0 grid-cols-[3.5rem_1fr] items-stretch rounded-[1.15rem] border px-3 py-2 ${rowClassName}`}
              >
                <span
                  className={`flex h-full items-center justify-center border-r pr-3 text-[1.45rem] font-semibold leading-none ${positionClassName}`}
                >
                  {index + 1}
                </span>
                <div className="flex min-w-0 items-center justify-between gap-3 pl-3">
                  <p className="min-w-0 truncate text-[0.72rem] font-semibold uppercase leading-none tracking-[0.08em] text-foreground">
                    {table.name}
                  </p>
                  <p className="shrink-0 text-[1.08rem] font-semibold leading-none tabular-nums text-foreground">
                    {table.score}
                  </p>
                </div>
              </div>
            );
          })}
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
