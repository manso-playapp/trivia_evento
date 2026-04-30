# Handoff Context

- generated_at: 2026-04-30T13:02:50.783Z
- release_version: 0.7.0
- release_date: 2026-04-29
- source_changelog: docs/CHANGELOG.md
- source_context: docs/PROJECT_CONTEXT.md

## Compressed Context

Trivia corporativa en vivo con tres vistas: `screen`, `operator` y `play`. El estado del juego esta modelado como snapshot unico con `revision` y `lastEvent`. Hoy puede correr en modo mock local o en modo Supabase con writes por backend (`server`). Las respuestas de las mesas viven en una tabla separada `submitted_answers` (PK compuesto `game_id, table_id, round_number`) para evitar conflictos de revision entre mesas concurrentes. El snapshot de `game_sessions` sigue siendo la fuente de verdad del flujo del juego.

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

- D  app/api/meta/context/checkpoint/route.ts
- M  components/game-provider.tsx
- M  components/operator-controls.tsx
- M  components/version-context-panel.tsx
- M  components/views/operator-view.tsx
- M  components/views/play-view.tsx
- M  components/views/screen-view.tsx
- M  data/initial-game-state.ts
- M  engine/game-command-runner.ts
- M  engine/game-domain.ts
- M  lib/game-command-validator.ts
- M  lib/game-storage.ts
- M  lib/server/game-session-store.ts
- M  scripts/e2e-20-tables.mjs
- M  services/game-service.ts
- M  services/mock-game-service.ts
- M  services/supabase-game-service.ts
- M  types/game-command.ts
- M  types/game-state.ts
- M  types/index.ts
- A  types/score-adjustment.ts

## Recent Commits

- 35060cd chore: usar clases Tailwind canónicas en operator-controls y screen-view
- 06bb39e fix: ronda.mp3 no sonaba durante preguntas activas
- 0f6103f docs: registrar decisiones y pendientes de sesión 2026-04-29
- 52366a1 fix: eliminar lag y pérdida de respuestas con 20 mesas concurrentes
- 4a9886f Release: nueva versión — referencia 050ece8
- 050ece8 feat: comprehensive update to game components, services, and new features
- ace0586 chore: update branding logo asset and screen header sizing
- 5af88e7 feat: polish broadcast UI, mobile timer, branding and screen layout
- e7974d8 feat: compact broadcast screen 1356x768 and fix qr hydration
- 03e3308 feat: table roster naming and automatic context checkpoints

## Handoff Checklist

- Confirmar version activa leyendo `docs/CHANGELOG.md`.
- Leer `## Estado actual` y `## Riesgos abiertos` en este archivo.
- Leer `docs/session-2026-04-29-fixes-incidente.md` para contexto del incidente.
- Verificar `npm run lint` y `npm run build` antes de seguir cambios.
- Si hay secreto expuesto en chat, rotarlo antes de deploy.

## Open Risks

- Falta auth fuerte por usuario real para operador y mesas.
- Falta mover logica critica a RPC/transaccion atomica en Supabase.
- Falta scheduler de baja latencia para timers en produccion.
- `submitted_answers` no tiene policy de INSERT/UPDATE para anon: las escrituras

## Prompt For New Thread

```text
Continuar Trivia Evento desde version 0.7.0.
Revisar docs/CHANGELOG.md, docs/PROJECT_CONTEXT.md y docs/HANDOFF_CONTEXT.md.
Usar engine/services actuales y no romper el flujo operator/screen/play.
```
