# Project Context

- context_updated_at: 2026-04-29
- context_owner: docs/PROJECT_CONTEXT.md
- changelog_source: docs/CHANGELOG.md

## Resumen operativo

Trivia corporativa en vivo con tres vistas: `screen`, `operator` y `play`.
El estado del juego esta modelado como snapshot unico con `revision` y
`lastEvent`. Hoy puede correr en modo mock local o en modo Supabase con writes
por backend (`server`).

Las respuestas de las mesas viven en una tabla separada `submitted_answers`
(PK compuesto `game_id, table_id, round_number`) para evitar conflictos de
revision entre mesas concurrentes. El snapshot de `game_sessions` sigue siendo
la fuente de verdad del flujo del juego.

## Estado actual

- Stack: Next.js App Router + TypeScript + Tailwind + shadcn/ui.
- Roster configurable: hasta 20 mesas, con activacion y nombres editables.
- Seguridad MVP: sesion de operador y sesion de mesa por cookie `httpOnly`.
  El `tableId` en submit_answer se deriva de la cookie, no del body.
- Realtime MVP: snapshot en Supabase + canal separado para `submitted_answers`.
  Las respuestas llegan via Realtime sin pasar por el sistema de revision.
- Automatizacion: tick backend para lock/reveal/score con delays configurables.
- Optimistic update en submit_answer (modo server): feedback visual instantaneo
  sin esperar round-trip al servidor.
- Probado en produccion: evento 2026-04-26 con 20 mesas. Incidente diagnosticado
  y corregido en v0.7.0. Ver `docs/session-2026-04-29-fixes-incidente.md`.

## Flujo recomendado para cambios

- Cada cambio funcional debe actualizar `docs/CHANGELOG.md`.
- Si el cambio impacta arquitectura o operacion, actualizar este archivo.
- Mantener en sync version, fecha y estado real del sistema.
- Ejecutar `npm run context:checkpoint` antes de cerrar una sesion larga.
- En este repo, el hook `pre-commit` ya dispara ese checkpoint automaticamente.

## Handoff rapido para nuevo hilo

- Confirmar version activa leyendo `docs/CHANGELOG.md`.
- Leer `## Estado actual` y `## Riesgos abiertos` en este archivo.
- Leer `docs/session-2026-04-29-fixes-incidente.md` para contexto del incidente.
- Verificar `npm run lint` y `npm run build` antes de seguir cambios.
- Si hay secreto expuesto en chat, rotarlo antes de deploy.

## Pendientes por prioridad

1. ~~Diagnostico y fix del lag del evento 2026-04-26~~ — **CERRADO en v0.7.0**
2. Tests del engine (`engine/game-domain.ts`) con vitest, apuntar a 80% cobertura.
   No cambiar codigo del engine, solo testearlo.
3. Comodines en el celular — pedir reglas al usuario antes de implementar.
4. Multi-tenant — solo despues de 2 y 3. Ver `HANDOFF_TO_CLAUDE_CODE.md` para plan.

## Riesgos abiertos

- Falta auth fuerte por usuario real para operador y mesas.
- Falta mover logica critica a RPC/transaccion atomica en Supabase.
- Falta scheduler de baja latencia para timers en produccion.
- `submitted_answers` no tiene policy de INSERT/UPDATE para anon: las escrituras
  pasan por service_role via backend. Si se cambia el modo de escritura hay que
  revisar las policies de RLS.

## Prompt de arranque sugerido

Usar este bloque para abrir nuevo hilo con contexto comprimido:

```text
Continuar Trivia Evento desde version 0.7.0.
Revisar primero docs/CHANGELOG.md, docs/PROJECT_CONTEXT.md y
docs/session-2026-04-29-fixes-incidente.md.
Mantener arquitectura actual (engine/services/ui) y no romper flujo operator/screen/play.
```
