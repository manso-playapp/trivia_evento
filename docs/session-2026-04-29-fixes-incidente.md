# Sesión 2026-04-29 — Fixes incidente lag + seguridad

## Estado al abrir la sesión

- Trivia corrida en producción el sábado 2026-04-26 con 20 mesas reales.
- Síntoma 1: respuestas no se marcaban en el celular, había que insistir.
- Síntoma 2: comodines solo disponibles desde el panel del operador.
- El handoff de la sesión estratégica previa indicaba diagnosticar primero, no tocar código.

---

## Diagnóstico (Prioridad 1, completado)

Archivo generado: `docs/incident-2026-04-26-lag-respuestas.md`

**Causa raíz 1 — Sin optimistic update en modo server:**
En `NEXT_PUBLIC_GAME_WRITE_MODE=server`, `submitAnswer` disparaba el POST y
retornaba sin actualizar el estado local. El botón no se veía seleccionado
hasta que volvía la respuesta HTTP completa (1–3 segundos en WiFi saturado).

**Causa raíz 2 — Cascada de conflictos de revisión con 20 clientes concurrentes:**
El snapshot de `game_sessions` tiene un campo `revision` único. Con 20 mesas
respondiendo al mismo tiempo, solo 1 ganaba el write; las otras 19 recibían 409.
El retry loop tenía 3 intentos y después abandonaba en silencio. Las mesas que
caían en la ola 4+ nunca registraban su respuesta.

**Amplificador — submitAnswer permite cambiar la respuesta:**
El dominio acepta una nueva opción si ya existía una para esa mesa/ronda.
Sin feedback visual y con insistencia del usuario, el re-tap podía cambiar
la respuesta original por la opción tocada "de más".

---

## Fixes implementados (todos en v0.7.0, pusheados a main)

### Fix A — Tabla separada submitted_answers (causa raíz 2)
**Decisión:** mover las respuestas fuera del snapshot de revisión.
Nueva tabla `submitted_answers` con PK compuesto `(game_id, table_id, round_number)`.
El upsert es atómico por mesa; 20 mesas concurrentes no compiten entre sí.

Por qué PK compuesto y no UUID: el upsert `ON CONFLICT` necesita la clave para
ser idempotente. Una mesa puede cambiar su respuesta durante la ronda activa
(el dominio lo permite) y el upsert refleja eso sin crear duplicados.

`game_sessions` sigue siendo la fuente de verdad del flujo del juego.
`submitted_answers` es solo la fuente de verdad de las respuestas activas.
`readOrSeedServerGameState` lee ambas en paralelo y las mergea antes de pasarlas
a los reducers del dominio — lockRound y applyScores siguen funcionando sin cambios.

### Fix B — Optimistic update en cliente (causa raíz 1)
**Decisión:** aplicar el reducer localmente antes del POST.
`submitAnswer` en modo server llama a `setCachedState` antes del round-trip.
El botón se ve seleccionado instantáneamente. Si el POST falla, `pullRemoteState`
revierte al estado real del servidor.

### Fix C — tableId desde cookie httpOnly (seguridad)
**Decisión:** ignorar el `tableId` del body del request.
`getAuthenticatedTableId(request)` es la fuente de verdad del tableId.
Un participante no puede votar por otra mesa aunque tenga sesión para varias
(por haber escaneado múltiples QR). El body puede decir lo que quiera.
La cookie httpOnly no es accesible desde JavaScript.

### Fix D — Orden invertido en reset_game (atomicidad)
**Decisión:** limpiar submitted_answers ANTES de persistir el reset.
Si el clear falla, el comando entero falla → el cliente recibe error → el estado
no queda reseteado con respuestas huérfanas de la partida anterior.
Se eliminó el `.catch(console.error)` que silenciaba el error.

---

## Pendientes acumulados

| Prioridad | Tarea | Estado |
|-----------|-------|--------|
| 2 | Tests del engine (`engine/game-domain.ts`, vitest, 80% cobertura) | Pendiente |
| 3 | Comodines en el celular (feature, pedir reglas antes de implementar) | Pendiente |
| 4 | Multi-tenant (nueva tabla `event_configs`, rutas por slug, branding dinámico) | Pendiente — después de 2 y 3 |

Riesgos abiertos heredados del repo (no son bloqueantes hoy):
- Auth fuerte por usuario real para operador y mesas.
- Lógica crítica en RPC/transacción SQL (hoy es read → compute → write, no atómica).
- Scheduler de baja latencia para timers automáticos en producción.

---

## Próximo paso acordado

**Validación empírica con dispositivos reales antes de siguiente sesión de código.**

Probar el build actual (v0.7.0) en condiciones similares al evento:
- Abrir `/play/[tableId]` en varios celulares simultáneamente.
- Verificar que al tocar respuesta el botón se marca inmediatamente.
- Verificar que con múltiples dispositivos respondiendo al mismo tiempo
  todas las respuestas llegan al operador sin que ninguna se pierda.
- Confirmar que reset_game limpia las respuestas en pantalla de los celulares.

Si la validación pasa → arrancar Prioridad 2 (tests del engine).
Si aparece algo raro → abrir sesión de diagnóstico antes de seguir.
