# Changelog

Registro de cambios del proyecto. Este archivo es la fuente de verdad para la
version visible en admin.

## [0.6.0] - 2026-04-11
- Se agrego alta y baja de mesas (activas/inactivas) desde `/operator`.
- Se agrego edicion de nombre de mesa desde `/operator`.
- Se filtro ranking, grilla publica, QR y respuestas para usar solo mesas activas.
- Se bloqueo el cambio de roster/nombres fuera de `idle` o `game_finished`.
- Se agrego panel de version/contexto en admin alimentado por archivos `.md`.

## [0.5.0] - 2026-04-09
- Se agrego acceso por QR unico por mesa con URL de participacion.
- Se agrego auto-acceso por query `?code=` en `/play/[tableId]`.
- Se centralizo generacion de links/codigos por mesa.

## [0.4.0] - 2026-04-09
- Se agrego autenticacion minima para operador y mesas por cookie `httpOnly`.
- Se agrego modo `server` para comandos criticos.
- Se agrego control de concurrencia por `revision`.

## [0.3.0] - 2026-04-09
- Se preparo servicio de sincronizacion para Supabase.
- Se agregaron endpoints backend para estado y comandos.
- Se agrego capa de eventos del dominio.

## [0.2.0] - 2026-04-08
- Se completo MVP visual con `/screen`, `/operator`, `/play/[tableId]`.
- Se definio engine de juego con rondas, scoring y power-ups.

## [0.1.0] - 2026-04-08
- Base inicial con Next.js App Router, TypeScript y Tailwind.
