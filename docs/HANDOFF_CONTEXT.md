# Handoff Context

- generated_at: 2026-05-06T22:36:31.943Z
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

- Workspace limpio

## Recent Commits

- 4d07e92 fix: filtro Realtime submitted_answers por table_id (Hipótesis 2)
- 5fa2097 fix: una cookie = un table_id, rechazar reauth con id distinto (cierra colisión mesa 2 ↔ mesa 4)
- e501d4c docs: diagnóstico colisión mesas Trivia Evento
- 20f59dc refactor: eliminar fallbacks ?? [] redundantes en operator-controls
- ee0809a feat: comodines self-service + herramientas de corrección del operador
- 35060cd chore: usar clases Tailwind canónicas en operator-controls y screen-view
- 06bb39e fix: ronda.mp3 no sonaba durante preguntas activas
- 0f6103f docs: registrar decisiones y pendientes de sesión 2026-04-29
- 52366a1 fix: eliminar lag y pérdida de respuestas con 20 mesas concurrentes
- 4a9886f Release: nueva versión — referencia 050ece8

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
