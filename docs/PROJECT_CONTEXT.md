# Project Context

- context_updated_at: 2026-04-11
- context_owner: docs/PROJECT_CONTEXT.md
- changelog_source: docs/CHANGELOG.md

## Resumen operativo

Trivia corporativa en vivo con tres vistas: `screen`, `operator` y `play`.
El estado del juego esta modelado como snapshot unico con `revision` y
`lastEvent`. Hoy puede correr en modo mock local o en modo Supabase con writes
por backend (`server`).

## Estado actual

- Stack: Next.js App Router + TypeScript + Tailwind + shadcn/ui.
- Roster configurable: hasta 20 mesas, con activacion y nombres editables.
- Seguridad MVP: sesion de operador y sesion de mesa por cookie `httpOnly`.
- Realtime MVP: snapshot en Supabase + comandos server con control por revision.
- Automatizacion: tick backend para lock/reveal/score con delays configurables.

## Flujo recomendado para cambios

- Cada cambio funcional debe actualizar `docs/CHANGELOG.md`.
- Si el cambio impacta arquitectura o operacion, actualizar este archivo.
- Mantener en sync version, fecha y estado real del sistema.
- Ejecutar `npm run context:checkpoint` antes de cerrar una sesion larga.
- En este repo, el hook `pre-commit` ya dispara ese checkpoint automaticamente.

## Handoff rapido para nuevo hilo

- Confirmar version activa leyendo `docs/CHANGELOG.md`.
- Leer `## Estado actual` y `## Riesgos abiertos` en este archivo.
- Verificar `npm run lint` y `npm run build` antes de seguir cambios.
- Si hay secreto expuesto en chat, rotarlo antes de deploy.

## Riesgos abiertos

- Falta auth fuerte por usuario real para operador y mesas.
- Falta mover toda logica critica a backend transaccional/RPC.
- Falta scheduler de baja latencia para juego en produccion.

## Prompt de arranque sugerido

Usar este bloque para abrir nuevo hilo con contexto comprimido:

```text
Continuar Trivia Evento desde version X.Y.Z.
Revisar primero docs/CHANGELOG.md y docs/PROJECT_CONTEXT.md.
Mantener arquitectura actual (engine/services/ui) y no romper flujo operator/screen/play.
```
