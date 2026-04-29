# Handoff Context

- generated_at: 2026-04-29T21:18:27.358Z
- release_version: 0.7.0
- release_date: 2026-04-29
- source_changelog: docs/CHANGELOG.md
- source_context: docs/PROJECT_CONTEXT.md

## Compressed Context

Trivia corporativa en vivo con tres vistas: `screen`, `operator` y `play`. El estado del juego esta modelado como snapshot unico con `revision` y `lastEvent`. Hoy puede correr en modo mock local o en modo Supabase con writes por backend (`server`).

## Latest Functional Changes

- Se agrego tabla `submitted_answers` en Supabase con clave primaria
- El endpoint `/api/game/command` para `submit_answer` ahora hace un upsert
- `readOrSeedServerGameState` lee `submitted_answers` en paralelo y mergea las
- Se agrego `clearSubmittedAnswersForGame` que se dispara al hacer `reset_game`
- En modo `server`, `submitAnswer` aplica el reducer localmente antes de hacer
- Si el POST falla, se hace `pullRemoteState()` para revertir al estado real.
- En modo `server`, el servicio de cliente abre un canal Realtime en
- Cada respuesta entrante se mergea en el estado local sin tocar el resto del

## Working Tree Snapshot

- M  app/api/game/command/route.ts
- M  docs/CHANGELOG.md
- A  docs/incident-2026-04-26-lag-respuestas.md
- M  lib/server/game-session-store.ts
- M  services/supabase-game-service.ts
- A  supabase/migrations/002_submitted_answers.sql
- M  supabase/schema.sql

## Recent Commits

- 4a9886f Release: nueva versión — referencia 050ece8
- 050ece8 feat: comprehensive update to game components, services, and new features
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
Continuar Trivia Evento desde version 0.7.0.
Revisar docs/CHANGELOG.md, docs/PROJECT_CONTEXT.md y docs/HANDOFF_CONTEXT.md.
Usar engine/services actuales y no romper el flujo operator/screen/play.
```
