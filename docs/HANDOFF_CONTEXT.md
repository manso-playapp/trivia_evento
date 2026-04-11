# Handoff Context

- generated_at: 2026-04-11T15:35:17.579Z
- release_version: 0.6.0
- release_date: 2026-04-11
- source_changelog: docs/CHANGELOG.md
- source_context: docs/PROJECT_CONTEXT.md

## Compressed Context

Trivia corporativa en vivo con tres vistas: `screen`, `operator` y `play`. El estado del juego esta modelado como snapshot unico con `revision` y `lastEvent`. Hoy puede correr en modo mock local o en modo Supabase con writes por backend (`server`).

## Latest Functional Changes

- Se agrego alta y baja de mesas (activas/inactivas) desde `/operator`.
- Se agrego edicion de nombre de mesa desde `/operator`.
- Se filtro ranking, grilla publica, QR y respuestas para usar solo mesas activas.
- Se bloqueo el cambio de roster/nombres fuera de `idle` o `game_finished`.
- Se agrego panel de version/contexto en admin alimentado por archivos `.md`.

## Working Tree Snapshot

- A  .githooks/pre-commit
- M  README.md
- A  app/api/meta/context/checkpoint/route.ts
- A  app/api/meta/context/route.ts
- M  components/game-provider.tsx
- M  components/table-access-grid.tsx
- M  components/table-grid.tsx
- A  components/table-roster-manager.tsx
- A  components/version-context-panel.tsx
- M  components/views/home-view.tsx
- M  components/views/operator-view.tsx
- M  components/views/play-view.tsx
- M  components/views/screen-view.tsx
- M  data/mock-tables.ts
- A  docs/CHANGELOG.md
- A  docs/CONTEXT_ARCHIVE.md
- A  docs/HANDOFF_CONTEXT.md
- A  docs/PROJECT_CONTEXT.md
- M  engine/game-command-runner.ts
- M  engine/game-domain.ts
- M  engine/game-selectors.ts
- M  hooks/use-game-view.ts
- M  lib/game-command-validator.ts
- A  lib/server/project-context-docs.ts
- M  package.json
- A  scripts/context-checkpoint.mjs
- A  scripts/install-hooks.sh
- M  services/game-service.ts
- M  services/mock-game-service.ts
- M  services/supabase-game-service.ts

## Recent Commits

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
Continuar Trivia Evento desde version 0.6.0.
Revisar docs/CHANGELOG.md, docs/PROJECT_CONTEXT.md y docs/HANDOFF_CONTEXT.md.
Usar engine/services actuales y no romper el flujo operator/screen/play.
```
