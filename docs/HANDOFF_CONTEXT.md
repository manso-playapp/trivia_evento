# Handoff Context

- generated_at: 2026-04-25T14:54:50.666Z
- release_version: 0.6.33
- release_date: 2026-04-18
- source_changelog: docs/CHANGELOG.md
- source_context: docs/PROJECT_CONTEXT.md

## Compressed Context

Trivia corporativa en vivo con tres vistas: `screen`, `operator` y `play`. El estado del juego esta modelado como snapshot unico con `revision` y `lastEvent`. Hoy puede correr en modo mock local o en modo Supabase con writes por backend (`server`).

## Latest Functional Changes

- Se forzo refresh de logo por nombre de archivo versionado: branding ahora usa `public/branding/company-logo-v3.png`.
- Esto evita cache stale de `next/image` cuando se reemplaza el logo con el mismo nombre.

## Working Tree Snapshot

- A  .history/app/api/game/command/route_20260409162648.ts
- A  .history/app/api/game/command/route_20260411152055.ts
- A  .history/data/mock-questions_20260425085755.ts
- A  .history/data/mock-questions_20260425102905.ts
- A  .history/data/mock-questions_20260425102907.ts
- A  .history/data/mock-questions_20260425102913.ts
- A  .history/data/mock-questions_20260425102917.ts
- A  .history/data/mock-questions_20260425102929.ts
- A  .history/data/mock-questions_20260425102954.ts
- A  .history/data/mock-questions_20260425102957.ts
- A  .history/data/mock-questions_20260425102959.ts
- A  .history/data/mock-questions_20260425103004.ts
- M  README.md
- M  app/api/game/command/route.ts
- M  app/api/table/session/route.ts
- M  app/globals.css
- M  components/answer-options-board.tsx
- M  components/event-header.tsx
- M  components/game-provider.tsx
- M  components/operator-controls.tsx
- M  components/power-up-badge.tsx
- M  components/question-card.tsx
- M  components/table-card.tsx
- M  components/table-grid.tsx
- M  components/table-roster-manager.tsx
- A  components/typewriter-text.tsx
- M  components/views/operator-view.tsx
- M  components/views/play-view.tsx
- M  components/views/screen-view.tsx
- M  data/README.md

## Recent Commits

- ace0586 chore: update branding logo asset and screen header sizing
- 5af88e7 feat: polish broadcast UI, mobile timer, branding and screen layout
- e7974d8 feat: compact broadcast screen 1356x768 and fix qr hydration
- 03e3308 feat: table roster naming and automatic context checkpoints
- d841b46 feat: add table qr access
- 0fae8bd feat: launch trivia evento MVP
- 5902b8e feat: initial commit
- 0207c0e Initial commit from Create Next App

## Handoff Checklist

- Confirmar version activa leyendo `docs/CHANGELOG.md`.
- Leer `## Estado actual` y `## Riesgos abiertos` en este archivo.
- Verificar `npm run lint` y `npm run build` antes de seguir cambios.
- Si hay secreto expuesto en chat, rotarlo antes de deploy.

## Open Risks

- Falta auth fuerte por usuario real para operador y mesas.
- Falta mover toda logica critica a backend transaccional/RPC.
- Falta scheduler de baja latencia para juego en produccion.

## Prompt For New Thread

```text
Continuar Trivia Evento desde version 0.6.33.
Revisar docs/CHANGELOG.md, docs/PROJECT_CONTEXT.md y docs/HANDOFF_CONTEXT.md.
Usar engine/services actuales y no romper el flujo operator/screen/play.
```
