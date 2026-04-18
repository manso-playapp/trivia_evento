# Handoff Context

- generated_at: 2026-04-18T22:54:10.908Z
- release_version: 0.6.30
- release_date: 2026-04-18
- source_changelog: docs/CHANGELOG.md
- source_context: docs/PROJECT_CONTEXT.md

## Compressed Context

Trivia corporativa en vivo con tres vistas: `screen`, `operator` y `play`. El estado del juego esta modelado como snapshot unico con `revision` y `lastEvent`. Hoy puede correr en modo mock local o en modo Supabase con writes por backend (`server`).

## Latest Functional Changes

- Fix de build/prerender: se quito query string del `src` de `next/image` para el logo (incompatible sin `images.localPatterns` en Next 16).
- Se paso a archivo versionado `public/branding/company-logo-white.png` y branding global actualizado para evitar cache stale sin romper compilacion.

## Working Tree Snapshot

- M  README.md
- M  app/globals.css
- M  app/operator/page.tsx
- M  app/page.tsx
- M  app/play/[tableId]/page.tsx
- M  app/screen/page.tsx
- M  components/answer-options-board.tsx
- M  components/app-shell.tsx
- A  components/company-logo.tsx
- M  components/event-header.tsx
- M  components/game-status-banner.tsx
- M  components/mobile-answer-pad.tsx
- A  components/mobile-round-timer.tsx
- M  components/operator-auth-panel.tsx
- M  components/operator-controls.tsx
- M  components/question-card.tsx
- M  components/ranking-board.tsx
- M  components/section-card.tsx
- A  components/success-confetti.tsx
- M  components/table-access-grid.tsx
- M  components/table-auth-panel.tsx
- M  components/table-card.tsx
- M  components/table-grid.tsx
- M  components/table-roster-manager.tsx
- M  components/timer-display.tsx
- M  components/ui/button.tsx
- M  components/ui/card.tsx
- M  components/version-context-panel.tsx
- M  components/views/play-view.tsx
- M  components/views/screen-view.tsx

## Recent Commits

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
Continuar Trivia Evento desde version 0.6.30.
Revisar docs/CHANGELOG.md, docs/PROJECT_CONTEXT.md y docs/HANDOFF_CONTEXT.md.
Usar engine/services actuales y no romper el flujo operator/screen/play.
```
