"use client";

import Link from "next/link";
import { ArrowRight, Monitor, SlidersHorizontal, Smartphone } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { EventHeader } from "@/components/event-header";
import { SectionCard } from "@/components/section-card";
import { useGameView } from "@/hooks/use-game-view";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const routeCards = [
  {
    href: "/screen",
    title: "Pantalla publica",
    description: "Vista broadcast con pregunta, timer, ranking y grilla de mesas.",
    icon: Monitor,
  },
  {
    href: "/operator",
    title: "Panel operador",
    description: "Controla el flujo del juego, scoring y comodines desde una sola vista.",
    icon: SlidersHorizontal,
  },
  {
    href: "/play/1",
    title: "Mesa 1",
    description: "Experiencia mobile de una mesa con respuestas grandes y feedback claro.",
    icon: Smartphone,
  },
];

export function HomeView() {
  const { activeTables, state, currentRoundNumber, statusMeta } = useGameView();
  const lastUpdatedLabel = state.updatedAt
    ? state.updatedAt.replace("T", " ").slice(0, 19)
    : "Sin actividad";

  return (
    <AppShell className="space-y-6">
      <EventHeader
        eventName={state.eventName}
        eventTagline={state.eventTagline}
        currentRoundNumber={Math.max(currentRoundNumber, 1)}
        totalRounds={state.totalRounds}
        statusLabel={statusMeta.label}
        statusTone={statusMeta.tone}
      />

      <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <SectionCard
          title="Navegacion principal"
          description="Abrilas en pestañas separadas para simular el flujo del evento en local."
        >
          <div className="grid gap-4 sm:grid-cols-3">
            {routeCards.map(({ href, title, description, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "h-auto min-h-40 flex-col items-start rounded-2xl border-border/70 bg-background/60 p-5 text-left hover:bg-background"
                )}
              >
                <Icon className="mb-5 size-6 text-accent" />
                <span className="text-lg font-semibold text-foreground">{title}</span>
                <span className="mt-2 whitespace-normal text-sm text-muted-foreground">
                  {description}
                </span>
                <span className="mt-6 inline-flex items-center gap-2 text-sm text-accent">
                  Abrir vista
                  <ArrowRight className="size-4" />
                </span>
              </Link>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Estado del MVP"
          description="La partida se guarda en localStorage y se comparte entre pestañas del navegador."
        >
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>Preguntas: {state.questions.length}</p>
            <p>Mesas activas: {activeTables.length}</p>
            <p>Capacidad total: {state.tables.length}</p>
            <p>Estado actual: {statusMeta.label}</p>
            <p>Ultima actualizacion: {lastUpdatedLabel}</p>
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}
